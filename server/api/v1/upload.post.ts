import Busboy from "busboy";
import { spawn } from "child_process";
import crypto from "crypto";
import fs from "fs";
import { createError, defineEventHandler } from "h3";
import type { IAudioMetadata } from "music-metadata";
import { parseFile } from "music-metadata";
import path from "path";
import { DatabaseService } from "~/server/utils/db";
import { tokenizeSong } from "~/server/utils/songs";
import type { MongoSong } from "~/types/mongo";
import { Config } from "../../utils/config";
import { getImageUUID, getSongUUID } from "../../utils/ids";

// --- Helper: Temp folder and file management ---

/**
 * Creates a temporary folder for storing uploaded files during processing.
 * @returns {string} The path to the created temporary folder.
 */
function createTempFolder(): string {
  const tempFolder = fs.mkdtempSync(
    path.join(Config.storage.tempDir, "upload-")
  );
  return tempFolder;
}

/**
 * Returns the paths for temporary files (mp3, ogg, metadata, song json) in the given temp folder.
 * @param tempFolder The temporary folder path.
 */
function getTempFilePaths(tempFolder: string) {
  return {
    mp3Path: path.join(tempFolder, "file.mp3"),
    oggPath: path.join(tempFolder, "file.ogg"),
    metaPath: path.join(tempFolder, "metadata.json"),
    songJsonPath: path.join(tempFolder, "song.json"),
  };
}

/**
 * Moves song files (mp3, ogg) from the temp folder to their permanent storage location.
 * @param files Array of file paths to move.
 * @param songId The unique song ID used for naming and subdirectory.
 */
async function moveSongFilesToPermanentLocation(
  files: string[],
  songId: string
) {
  const audioDir = Config.storage.audioDir;
  const subdir = songId.substring(2, 3);
  const destDir = path.join(audioDir, subdir);
  await fs.promises.mkdir(destDir, { recursive: true });
  for (const file of files) {
    // find file extension
    const ext = path.extname(file);
    const newFilePath = path.join(destDir, songId + ext);
    await fs.promises.rename(file, newFilePath);
  }
}

/**
 * Moves new image files from the temp folder to the permanent image directory.
 * @param images Array of image metadata objects.
 * @param tempFolder The temporary folder path.
 */
async function moveImageFilesToPermanentLocation(
  images: MongoSong["images"],
  tempFolder: string
) {
  if (!images || images.length === 0) {
    return;
  }
  const imageDir = Config.storage.imageDir;
  await fs.promises.mkdir(imageDir, { recursive: true });
  for (const img of images) {
    const imgPath = path.join(tempFolder, img.filename);
    const newImgPath = path.join(imageDir, img.filename);
    await fs.promises.rename(imgPath, newImgPath);
  }
}

// --- Helper: MP3 validation and SHA1 calculation ---

/**
 * Validates that the uploaded file is a valid MP3 and calculates its SHA1 hash.
 * @param mp3Path Path to the uploaded MP3 file.
 * @returns Metadata and SHA1 hash of the file.
 * @throws If the file is not a valid MP3.
 */
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

/**
 * Converts an MP3 file to OGG format using lame and oggenc.
 * @param mp3Path Path to the source MP3 file.
 * @param oggPath Path to the output OGG file.
 * @returns Promise that resolves when conversion is complete.
 */
function convertMp3ToOgg(mp3Path: string, oggPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const lameProc = spawn("lame", ["--silent", "--decode", mp3Path, "-"]);
    const oggencProc = spawn("oggenc", ["-Q", "-q", "10", "-", "-o", oggPath]);
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

/**
 * Extracts embedded images from MP3 metadata, deduplicates them, and writes new images to disk.
 * @param metadata The audio metadata containing possible images.
 * @param tempFolder The temporary folder to write new images.
 * @returns Object with arrays of new and duplicated images.
 */
async function extractImages(
  metadata: IAudioMetadata,
  tempFolder: string
): Promise<{
  newImages: MongoSong["images"];
  duplicatedImages: MongoSong["images"];
}> {
  const images: MongoSong["images"] = [];
  const duplicatedImages: MongoSong["images"] = [];
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
        if (existing && existing.images) {
          // Find the exact image in the array
          const found = existing.images.find(
            (img) => img.sha1 === sha1 && img.filename
          );
          if (found) {
            duplicatedImages.push(found);
            continue;
          }
        }

        const imgFilename = getImageUUID() + "." + ext;
        const imgPath = path.join(tempFolder, imgFilename);
        await fs.promises.writeFile(imgPath, pic.data);

        images.push({ filename: imgFilename, sha1, alternatives: {} });
      }
    }
  }
  return { newImages: images, duplicatedImages };
}

// --- Helper: MongoSong creation ---

/**
 * Creates a MongoSong object from metadata, file info, and user info.
 * @param params Object containing metadata, SHA1, filename, images, and userId.
 * @returns MongoSong object ready for insertion into MongoDB.
 */
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
  const title = metadata.common.title || "";
  const artist = metadata.common.artist || "";
  const genre = Array.isArray(metadata.common.genre)
    ? metadata.common.genre[0]
    : metadata.common.genre;
  const valid = Boolean(
    title && artist && genre && title !== "" && artist !== "" && genre !== ""
  );
  const artistsAndTitle = tokenizeSong({ artist, title });
  return {
    _id: songId,
    album: metadata.common.album || undefined,
    artist,
    date: metadata.common.year || undefined,
    duration: metadata.format.duration || undefined,
    filename: filenameToUse,
    genre,
    title,
    tokenartists: artistsAndTitle.artists,
    tokentitle: artistsAndTitle.title,
    hits: 0,
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

/**
 * Handles the upload POST request, processes the uploaded MP3, extracts metadata and images,
 * converts to OGG, stores files and metadata, and inserts the song into MongoDB.
 */
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
        const { mp3Path, oggPath } = getTempFilePaths(tempFolder);

        fileProcessingPromise = (async () => {
          let cleanupDone = false;
          const cleanup = async () => {
            if (!cleanupDone) {
              cleanupDone = true;
              try {
                await fs.promises.rm(tempFolder, {
                  recursive: true,
                  force: true,
                });
                console.log(`[upload] Cleaned up temp folder: ${tempFolder}`);
              } catch (e) {
                console.log(
                  `[upload] Failed to clean up temp folder: ${tempFolder}`,
                  e
                );
              }
            }
          };
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

            // Deduplication: check if SHA1 already exists
            const db = DatabaseService.getInstance();
            await db.connect();
            const songsCollection = db.getCollection<MongoSong>("songs");
            const existingSong = await songsCollection.findOne({
              sha1: mp3Sha1,
            });
            if (existingSong) {
              await cleanup();
              throw createError({
                statusCode: 409,
                statusMessage:
                  "A song with this file already exists (duplicate SHA1)",
              });
            }

            const [_, images] = await Promise.all([
              convertMp3ToOgg(mp3Path, oggPath),
              extractImages(metadata, tempFolder),
            ]);

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
              images:
                (images.newImages || []).concat(
                  images.duplicatedImages || []
                ) || [],
              userId: event.context.auth?.userId,
            });

            // Move the files to their permanent location
            await moveSongFilesToPermanentLocation(
              [mp3Path, oggPath],
              mongoSong._id
            );

            // Move images to their permanent location
            await moveImageFilesToPermanentLocation(
              images.newImages,
              tempFolder
            );

            // Insert mongoSong into MongoDB
            await songsCollection.insertOne(mongoSong);

            handled = true;
            resolve({ tempFolder, mongoSong });
            await cleanup(); // Clean up temp folder after success
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            console.log("[upload] Error during upload processing:", message);
            await cleanup(); // Clean up temp folder on error
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
