/**
 * GET /api/v1/songs/[id] endpoint
 * Retrieves a single song by ID for the authenticated user
 */

import { defineEventHandler, getRouterParam } from "h3";
import {
  createSuccessResponse,
  handleApiError,
  sendApiResponse,
} from "~/server/utils/api";
import { DatabaseService } from "~/server/utils/db";
import { songsApiLogger } from "~/server/utils/logger";
import type { ApiSong } from "~/types/api";
import type { MongoSong } from "~/types/mongo";

export default defineEventHandler(async (event) => {
  try {
    // Check if user is authenticated (middleware should already handle this)
    const { userId } = event.context.auth;
    if (!userId) {
      songsApiLogger.warn("Attempt to fetch song without authentication");
      return sendApiResponse(event, {
        success: false,
        error: "Authentication required",
        code: "UNAUTHORIZED",
        statusCode: 401,
      });
    }

    // Get song ID from URL
    const songId = getRouterParam(event, "id");
    if (!songId) {
      songsApiLogger.warn("Missing song ID parameter");
      return sendApiResponse(event, {
        success: false,
        error: "Missing song ID",
        code: "MISSING_SONG_ID",
        statusCode: 400,
      });
    }

    // Get database service
    const db = DatabaseService.getInstance();

    // Get songs collection
    await db.connect();
    const songsCollection = db.getCollection<MongoSong>("songs");

    // Get the song
    const song = await songsCollection.findOne({ _id: songId });
    if (!song) {
      songsApiLogger.warn({ songId }, "Song not found");
      return sendApiResponse(event, {
        success: false,
        error: "Song not found",
        code: "SONG_NOT_FOUND",
        statusCode: 404,
      });
    }

    // Check if the user can access this song
    if (song.user !== userId) {
      songsApiLogger.warn(
        { songId, userId, songUser: song.user },
        "Unauthorized attempt to access song"
      );
      return sendApiResponse(event, {
        success: false,
        error: "You are not authorized to access this song",
        code: "UNAUTHORIZED_ACCESS",
        statusCode: 403,
      });
    }

    // Format the song for API response
    const apiSong: ApiSong = {
      _id: song._id,
      album: song.album || "",
      artist: song.artist || "",
      date: song.date || 0,
      duration: song.duration || 0,
      filename: song.filename || "",
      genre: song.genre || "",
      hits: song.hits || 0,
      reviewed: song.reviewed || false,
      sha1: song.sha1 || "",
      title: song.title || "",
      tokenartists: song.tokenartists || [],
      tokentitle: song.tokentitle || "",
      tracknumber: song.tracknumber || 0,
      ts_creation: song.ts_creation || 0,
      canEdit: true, // User can always edit their own songs
      valid: song.valid || false,
    };

    songsApiLogger.info({ songId, userId }, "Song fetched successfully");

    // Return successful response
    return sendApiResponse(event, createSuccessResponse(apiSong));
  } catch (error) {
    // Log the error
    songsApiLogger.error(error, "Error fetching song");

    // Handle any errors
    return sendApiResponse(event, handleApiError(error));
  }
});
