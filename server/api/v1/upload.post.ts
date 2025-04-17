import Busboy from "busboy";
import { spawn } from "child_process";
import fs from "fs";
import { createError, defineEventHandler } from "h3";
import type { IAudioMetadata } from "music-metadata";
import { parseFile } from "music-metadata";
import path from "path";
import { Config } from "../../utils/config";

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

    busboy.on(
      "file",
      (fieldname: string, fileStream: NodeJS.ReadableStream) => {
        console.log(`[upload] File field received: ${fieldname}`);
        // Use configured temp directory
        const tempFolder = fs.mkdtempSync(
          path.join(Config.storage.tempDir, "upload-")
        );
        console.log(`[upload] Created temp folder: ${tempFolder}`);
        const mp3Path = path.join(tempFolder, "file.mp3");
        const oggPath = path.join(tempFolder, "file.ogg");
        const metaPath = path.join(tempFolder, "metadata.json");

        const mp3Write = fs.createWriteStream(mp3Path);
        fileStream.pipe(mp3Write);
        console.log(`[upload] Streaming file to: ${mp3Path}`);

        mp3Write.on("finish", async () => {
          console.log("[upload] Finished writing MP3 file");
          try {
            const metadata: IAudioMetadata = await parseFile(mp3Path);
            console.log("[upload] Extracted metadata:", metadata);
            if (!metadata.format.container?.toLowerCase().includes("mpeg")) {
              console.log("[upload] File is not a valid MP3");
              throw new Error("Uploaded file is not a valid MP3");
            }

            // --- Start OGG conversion (async) ---
            const oggPromise = new Promise<void>((res, rej) => {
              const lameProc = spawn("lame", [
                "--silent",
                "--decode",
                mp3Path,
                "-",
              ]);
              const oggencProc = spawn("oggenc", ["-Q", "-", "-o", oggPath]);
              lameProc.stdout.pipe(oggencProc.stdin);
              console.log("[upload] Started MP3 -> OGG conversion");
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
              lameProc.on("close", (code, signal) => {
                console.log(
                  `[upload] lame process closed with code ${code}, signal ${signal}`
                );
              });
              oggencProc.on("close", (code, signal) => {
                console.log(
                  `[upload] oggenc process closed with code ${code}, signal ${signal}`
                );
              });
              oggencProc.on("exit", (code: number) => {
                if (code === 0) {
                  console.log("[upload] OGG conversion successful:", oggPath);
                  res();
                } else {
                  console.log("[upload] OGG conversion failed");
                  rej(new Error("oggenc conversion failed"));
                }
              });
            });

            // --- Extract images from metadata (async) ---
            const imagePromise = (async () => {
              if (
                metadata.common.picture &&
                Array.isArray(metadata.common.picture)
              ) {
                for (let i = 0; i < metadata.common.picture.length; i++) {
                  const pic = metadata.common.picture[i];
                  if (pic && pic.data && pic.format) {
                    const ext = pic.format.split("/").pop() || "img";
                    const imgPath = path.join(tempFolder, `cover_${i}.${ext}`);
                    await fs.promises.writeFile(imgPath, pic.data);
                    console.log(`[upload] Extracted image to: ${imgPath}`);
                  }
                }
              }
            })();

            // --- Wait for both to finish ---
            await Promise.all([oggPromise, imagePromise]);

            // write metadata json
            const record = { mp3: mp3Path, ogg: oggPath, metadata };
            fs.writeFileSync(metaPath, JSON.stringify(record, null, 2));
            console.log("[upload] Wrote metadata JSON:", metaPath);

            handled = true;
            resolve({ tempFolder, record });
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
