import { createReadStream, existsSync, statSync } from "fs";
import {
  defineEventHandler,
  getRequestHeader,
  sendStream,
  setResponseHeaders,
  setResponseStatus,
} from "h3";
import { join } from "path";
import { SessionService } from "~/server/services/SessionService";
import { Config } from "~/server/utils/config";
import { authLogger } from "~/server/utils/logger";

/**
 * Server middleware to serve protected audio files under the /audio path
 */
export default defineEventHandler(async (event) => {
  // Only process requests starting with /audio
  const url = new URL(event.path, "http://localhost");
  const path = url.pathname;

  if (!path.startsWith("/audio")) {
    return;
  }

  // Check if user is authenticated by validating their session
  const sessionService = SessionService.getInstance();
  const sessionCookie = sessionService.getSessionIdFromCookie(event);

  if (!sessionCookie) {
    authLogger.debug({ path }, "No session cookie found for audio file access");
    return createError({
      statusCode: 401,
      message: "Authentication required to access audio files",
    });
  }

  // Validate the session
  const { valid, user } = await sessionService.validateSession(sessionCookie);

  if (!valid || !user) {
    authLogger.debug("Invalid session, audio access denied");
    sessionService.clearSessionCookie(event);
    return createError({
      statusCode: 401,
      message: "Authentication required to access audio files",
    });
  }

  // User is authenticated, now process the audio file request
  // Extract the file path relative to the audio directory
  const audioPath = path.replace(/^\/audio\/?/, "");
  const audioDir = Config.storage.audioDir;
  const fullPath = join(process.cwd(), audioDir, audioPath);

  // Security check: ensure path is within the audio directory
  if (
    !fullPath.startsWith(join(process.cwd(), audioDir)) ||
    !existsSync(fullPath)
  ) {
    return createError({
      statusCode: 404,
      message: "Audio file not found",
    });
  }

  try {
    // Get file stats to determine content-length
    const stats = statSync(fullPath);
    const fileSize = stats.size;

    // Determine content type based on file extension
    const contentType = getContentTypeFromPath(fullPath);

    // Get Range header
    const rangeHeader = getRequestHeader(event, "Range");

    // If there's no Range header, send the entire file with regular headers
    if (!rangeHeader) {
      setResponseHeaders(event, {
        "Content-Type": contentType,
        "Content-Length": fileSize.toString(),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000", // Cache for 1 year
      });

      // Stream the file to the client
      const stream = createReadStream(fullPath);
      return sendStream(event, stream);
    }

    // Parse the Range header
    const ranges = parseRangeHeader(rangeHeader, fileSize);

    // If ranges are invalid, return 416 Range Not Satisfiable
    if (!ranges || ranges.length === 0) {
      setResponseHeaders(event, {
        "Content-Type": contentType,
        "Content-Range": `bytes */${fileSize}`,
      });

      setResponseStatus(event, 416, "Range Not Satisfiable");
      return "Requested range not satisfiable";
    }

    // Currently we only support a single range request
    // Multi-range requests would require multipart/byteranges response which is more complex
    const start = ranges[0].start;
    const end = ranges[0].end;
    const contentLength = end - start + 1;

    // Set appropriate headers for partial content
    setResponseHeaders(event, {
      "Content-Type": contentType,
      "Content-Length": contentLength.toString(),
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=31536000", // Cache for 1 year
    });

    // Set the 206 Partial Content status code
    setResponseStatus(event, 206, "Partial Content");

    // Create a read stream for the specified byte range
    const stream = createReadStream(fullPath, { start, end });
    return sendStream(event, stream);
  } catch (error) {
    console.error("Error serving audio file:", error);
    return createError({
      statusCode: 500,
      message: "Failed to serve audio file",
    });
  }
});

/**
 * Get the appropriate content type based on file extension
 */
function getContentTypeFromPath(filePath: string): string {
  if (filePath.endsWith(".mp3")) {
    return "audio/mpeg";
  } else if (filePath.endsWith(".ogg")) {
    return "audio/ogg";
  } else if (filePath.endsWith(".wav")) {
    return "audio/wav";
  } else {
    return "application/octet-stream"; // Default binary content type
  }
}

/**
 * Parse Range header and return array of range objects
 *
 * @param rangeHeader - The Range header value (e.g., "bytes=0-499")
 * @param fileSize - The total size of the file in bytes
 * @returns Array of range objects with start and end positions, or null if invalid
 */
function parseRangeHeader(
  rangeHeader: string,
  fileSize: number
): { start: number; end: number }[] | null {
  // Range header should start with "bytes="
  if (!rangeHeader.startsWith("bytes=")) {
    return null;
  }

  try {
    // Extract the ranges part
    const rangesStr = rangeHeader.substring(6);
    const ranges: { start: number; end: number }[] = [];

    // Split by comma for multiple ranges (though we currently only support single range)
    const rangeValues = rangesStr.split(",");

    for (const range of rangeValues) {
      // Split the range into start and end positions
      const [startStr, endStr] = range.trim().split("-");

      // Handle suffix range like "bytes=-500" (last 500 bytes)
      if (startStr === "" && endStr !== "") {
        const end = fileSize - 1;
        const suffixLength = parseInt(endStr);

        if (isNaN(suffixLength) || suffixLength <= 0) {
          return null;
        }

        const start = Math.max(0, fileSize - suffixLength);
        ranges.push({ start, end });
        continue;
      }

      // Parse start position
      const start = startStr !== "" ? parseInt(startStr) : 0;

      // Handle open-ended range like "bytes=500-" (from byte 500 to end)
      const end = endStr !== "" ? parseInt(endStr) : fileSize - 1;

      // Validate range values
      if (
        isNaN(start) ||
        isNaN(end) ||
        start < 0 ||
        end >= fileSize ||
        start > end
      ) {
        // Invalid range
        continue;
      }

      ranges.push({ start, end });
    }

    // Return null if all ranges were invalid
    return ranges.length > 0 ? ranges : null;
  } catch (error) {
    console.error("Error parsing Range header:", error);
    return null;
  }
}
