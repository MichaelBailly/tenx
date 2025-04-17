import Busboy from "busboy";
import { spawn } from "child_process";
import crypto from "crypto";
import fs from "fs";
import { createError, defineEventHandler } from "h3";
import type { IAudioMetadata } from "music-metadata";
import { parseFile } from "music-metadata";
import path from "path";
import { DatabaseService } from "~/server/utils/db";
import type { MongoSong } from "~/types/mongo";
import { Config } from "../../utils/config";
import { getImageUUID, getSongUUID } from "../../utils/ids";

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
    // Prepare DB access
    const db = DatabaseService.getInstance();
    await db.connect();
    const songsCollection = db.getCollection<MongoSong>("songs");
    for (let i = 0; i < metadata.common.picture.length; i++) {
      const pic = metadata.common.picture[i];
      if (pic && pic.data && pic.format) {
        const ext = pic.format.split("/").pop() || "img";
        // Compute SHA1 for the image
        const sha1 = crypto.createHash("sha1").update(pic.data).digest("hex");
        // Try to find an existing image with the same sha1
        const existing = await songsCollection.findOne({
          images: { $elemMatch: { sha1 } },
        });
        let imgFilename: string;
        if (existing && existing.images) {
          // Find the exact image in the array
          const found = existing.images.find(
            (img) => img.sha1 === sha1 && img.filename
          );
          if (found && found.filename) {
            imgFilename = found.filename;
          } else {
            imgFilename = getImageUUID() + "." + ext;
            const imgPath = path.join(tempFolder, imgFilename);
            await fs.promises.writeFile(imgPath, pic.data);
          }
        } else {
          imgFilename = getImageUUID() + "." + ext;
          const imgPath = path.join(tempFolder, imgFilename);
          await fs.promises.writeFile(imgPath, pic.data);
        }
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
  userId,
}: {
  metadata: IAudioMetadata;
  mp3Sha1: string;
  filenameToUse: string;
  images: MongoSong["images"];
  userId: string;
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
    reviewed: false,
    sha1: mp3Sha1,
    user: userId,
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
  const userId = event.context.auth?.userId;
  if (typeof userId !== "string" || userId.trim() === "") {
    throw createError({
      statusCode: 401,
      statusMessage: "Authentication required: userId missing or invalid.",
    });
  }
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
    let fileProcessingPromise: Promise<void> | null = null;

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

        fileProcessingPromise = (async () => {
          try {
            await new Promise<void>((res, rej) => {
              const mp3Write = fs.createWriteStream(mp3Path);
              fileStream.pipe(mp3Write);
              mp3Write.on("finish", res);
              fileStream.on("error", rej);
              mp3Write.on("error", rej);
            });
            console.log("[upload] Finished writing MP3 file");

            const { metadata, sha1: mp3Sha1 } = await validateAndHashMp3(
              mp3Path
            );
            await convertMp3ToOgg(mp3Path, oggPath);
            const images = await extractImages(metadata, tempFolder);

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
              userId: event.context.auth?.userId,
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
            if (!handled)
              reject(createError({ statusCode: 400, statusMessage: message }));
          }
        })();
      }
    );

    busboy.on("field", (fieldname, val) => {
      if (fieldname === "filename") {
        uploadedFilename = val;
      }
    });

    busboy.on("error", (err: Error) => {
      console.log("[upload] Busboy error:", err);
      if (!handled)
        reject(createError({ statusCode: 500, statusMessage: err.message }));
    });

    busboy.on("finish", async () => {
      console.log("[upload] Busboy finished parsing");
      if (fileProcessingPromise) {
        try {
          await fileProcessingPromise;
        } catch (err) {
          console.log(err);
          // Already handled in fileProcessingPromise
        }
      } else if (!handled) {
        reject(
          createError({ statusCode: 400, statusMessage: "No file uploaded" })
        );
      }
    });

    req.pipe(busboy);
  });
});
