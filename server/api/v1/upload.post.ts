import Busboy from "busboy";
import { spawn } from "child_process";
import crypto from "crypto";
import fs from "fs";
import { createError, defineEventHandler } from "h3";
import type { IAudioMetadata } from "music-metadata";
import { parseFile } from "music-metadata";
import path from "path";
import type { MongoSong } from "~/types/mongo";
import { Config } from "../../utils/config";
import { getSongUUID } from "../../utils/ids";

// --- Helper: Temp folder and file management ---
function createTempFolder(): string {
  const tempFolder = fs.mkdtempSync(
    path.join(Config.storage.tempDir, "upload-")
  );
  return tempFolder;
}

function getTempFilePaths(tempFolder: string) {
  return {
    mp3Path: path.join(tempFolder, "file.mp3"),
    oggPath: path.join(tempFolder, "file.ogg"),
    metaPath: path.join(tempFolder, "metadata.json"),
    songJsonPath: path.join(tempFolder, "song.json"),
  };
}

// --- Helper: MP3 validation and SHA1 calculation ---
async function validateAndHashMp3(
  mp3Path: string
): Promise<{ metadata: IAudioMetadata; sha1: string }> {
  const metadata = await parseFile(mp3Path);
  if (!metadata.format.container?.toLowerCase().includes("mpeg")) {
    throw new Error("Uploaded file is not a valid MP3");
  }
  const mp3Buffer = await fs.promises.readFile(mp3Path);
  const sha1 = crypto.createHash("sha1").update(mp3Buffer).digest("hex");
  return { metadata, sha1 };
}

// --- Helper: OGG conversion ---
function convertMp3ToOgg(mp3Path: string, oggPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const lameProc = spawn("lame", ["--silent", "--decode", mp3Path, "-"]);
    const oggencProc = spawn("oggenc", ["-Q", "-", "-o", oggPath]);
    lameProc.stdout.pipe(oggencProc.stdin);
    lameProc.stderr.on("data", (data) => {
      console.log("[upload] lame stderr:", data.toString());
    });
    oggencProc.stderr.on("data", (data) => {
      console.log("[upload] oggenc stderr:", data.toString());
    });
    lameProc.on("error", (err) => {
      console.log("[upload] lame process error:", err);
    });
    oggencProc.on("error", (err) => {
      console.log("[upload] oggenc process error:", err);
    });
    oggencProc.on("exit", (code: number) => {
      if (code === 0) {
        console.log("[upload] OGG conversion successful:", oggPath);
        resolve();
      } else {
        console.log("[upload] OGG conversion failed");
        reject(new Error("oggenc conversion failed"));
      }
    });
  });
}

// --- Helper: Image extraction ---
async function extractImages(
  metadata: IAudioMetadata,
  tempFolder: string
): Promise<MongoSong["images"]> {
  const images: MongoSong["images"] = [];
  if (metadata.common.picture && Array.isArray(metadata.common.picture)) {
    for (let i = 0; i < metadata.common.picture.length; i++) {
      const pic = metadata.common.picture[i];
      if (pic && pic.data && pic.format) {
        const ext = pic.format.split("/").pop() || "img";
        const imgFilename = `cover_${i}.${ext}`;
        const imgPath = path.join(tempFolder, imgFilename);
        await fs.promises.writeFile(imgPath, pic.data);
        const imgBuffer = await fs.promises.readFile(imgPath);
        const sha1 = crypto.createHash("sha1").update(imgBuffer).digest("hex");
        images.push({ filename: imgFilename, sha1, alternatives: {} });
      }
    }
  }
  return images;
}

// --- Helper: MongoSong creation ---
function createMongoSong({
  metadata,
  mp3Sha1,
  filenameToUse,
  images,
}: {
  metadata: IAudioMetadata;
  mp3Sha1: string;
  filenameToUse: string;
  images: MongoSong["images"];
}): MongoSong {
  const songId = getSongUUID();
  const title = metadata.common.title || undefined;
  const artist = metadata.common.artist || undefined;
  const genre = Array.isArray(metadata.common.genre)
    ? metadata.common.genre[0]
    : metadata.common.genre;
  const valid = Boolean(
    title && artist && genre && title !== "" && artist !== "" && genre !== ""
  );
  return {
    _id: songId,
    album: metadata.common.album || undefined,
    artist,
    date: metadata.common.year || undefined,
    duration: metadata.format.duration || undefined,
    filename: filenameToUse,
    genre,
    title,
    tracknumber: metadata.common.track?.no || undefined,
    images: Array.isArray(images) ? images : undefined,
    ts_creation: Date.now(),
    valid,
    sha1: mp3Sha1,
    sourceFile:
      metadata.format.container && metadata.format.codec
        ? {
            type: metadata.format.container,
            extension: path.extname(filenameToUse).replace(".", ""),
          }
        : undefined,
  };
}

export default defineEventHandler(async (event) => {
  const req = event.node.req;
  const headers = req.headers;
  if (
    !headers["content-type"] ||
    !headers["content-type"].includes("multipart/form-data")
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "Expected multipart/form-data",
    });
  }

  return await new Promise((resolve, reject) => {
    console.log("[upload] Incoming upload request");
    const busboy = Busboy({ headers });
    let handled = false;
    let uploadedFilename: string | undefined;

    busboy.on(
      "file",
      (
        fieldname: string,
        fileStream: NodeJS.ReadableStream,
        filename: string
      ) => {
        console.log(`[upload] File field received: ${fieldname}`);
        uploadedFilename = filename;
        const tempFolder = createTempFolder();
        console.log(`[upload] Created temp folder: ${tempFolder}`);
        const { mp3Path, oggPath, metaPath, songJsonPath } =
          getTempFilePaths(tempFolder);

        const mp3Write = fs.createWriteStream(mp3Path);
        fileStream.pipe(mp3Write);
        console.log(`[upload] Streaming file to: ${mp3Path}`);

        mp3Write.on("finish", async () => {
          console.log("[upload] Finished writing MP3 file");
          try {
            const { metadata, sha1: mp3Sha1 } = await validateAndHashMp3(
              mp3Path
            );
            const oggPromise = convertMp3ToOgg(mp3Path, oggPath);
            const imagePromise = extractImages(metadata, tempFolder);
            const images = await imagePromise;
            await oggPromise;

            let filenameToUse = "file.mp3";
            if (
              typeof uploadedFilename === "string" &&
              uploadedFilename.trim() !== ""
            ) {
              filenameToUse = uploadedFilename;
            }
            const mongoSong = createMongoSong({
              metadata,
              mp3Sha1,
              filenameToUse,
              images,
            });

            // write metadata json
            const record = { mp3: mp3Path, ogg: oggPath, metadata };
            fs.writeFileSync(metaPath, JSON.stringify(record, null, 2));
            // write song.json
            fs.writeFileSync(songJsonPath, JSON.stringify(mongoSong, null, 2));
            console.log("[upload] Wrote metadata JSON:", metaPath);
            console.log("[upload] Wrote MongoSong JSON:", songJsonPath);

            handled = true;
            resolve({ tempFolder, record, mongoSong });
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            console.log("[upload] Error during upload processing:", message);
            reject(createError({ statusCode: 400, statusMessage: message }));
          }
        });

        fileStream.on("error", (err: Error) => {
          console.log("[upload] File stream error:", err);
          if (!handled)
            reject(
              createError({ statusCode: 500, statusMessage: err.message })
            );
        });
      }
    );

    busboy.on("field", (fieldname, val) => {
      if (fieldname === "filename") {
        uploadedFilename = val;
      }
    });

    busboy.on("error", (err: Error) => {
      console.log("[upload] Busboy error:", err);
      reject(createError({ statusCode: 500, statusMessage: err.message }));
    });

    busboy.on("finish", () => {
      console.log("[upload] Busboy finished parsing");
    });

    req.pipe(busboy);
  });
});
