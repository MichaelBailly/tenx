/**
 * GET /api/v1/songs endpoint
 * Retrieves a list of songs accessible to the authenticated user
 * Supports pagination and sorting
 */

import { defineEventHandler, getQuery } from "h3";
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
      songsApiLogger.warn("Attempt to access songs without authentication");
      return sendApiResponse(event, {
        success: false,
        error: "Authentication required",
        code: "UNAUTHORIZED",
        statusCode: 401,
      });
    }

    // Parse query parameters
    const query = getQuery(event);
    const page = parseInt((query.page as string) || "1", 10);
    const limit = Math.min(parseInt((query.limit as string) || "20", 10), 100);
    const skip = (page - 1) * limit;
    const sort = (query.sort as string) || "title";

    songsApiLogger.debug({ userId, page, limit, sort }, "Fetching songs");

    // Get database service
    const db = DatabaseService.getInstance();

    // Get songs collection
    const result = await db.withConnection(async () => {
      const songsCollection = db.getCollection<MongoSong>("songs");

      // Build sort object
      const sortObj: Record<string, 1 | -1> = {};
      if (sort.startsWith("-")) {
        sortObj[sort.substring(1)] = -1;
      } else {
        sortObj[sort] = 1;
      }

      // Count total documents for pagination info
      const totalSongs = await songsCollection.countDocuments();

      // Get songs with pagination
      const songs = await songsCollection
        .find({})
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .toArray();

      // Enhance songs with canEdit field and ensure they match the ApiSong type
      const enhancedSongs = songs.map((song) => {
        songsApiLogger.debug(song, "Song");
        // Create a new object that conforms to ApiSong
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
          canEdit: song.user === userId,
          valid: song.valid || false,
        };

        // Add optional properties if they exist in the source
        if (song.images && song.images.length > 0) {
          apiSong.images = [...song.images];
        }

        if (song.sourceFile) {
          apiSong.sourceFile = { ...song.sourceFile };
        }

        return apiSong;
      });

      songsApiLogger.debug(
        { count: enhancedSongs.length, total: totalSongs },
        "Songs retrieved successfully"
      );

      return {
        songs: enhancedSongs,
        pagination: {
          total: totalSongs,
          page,
          limit,
          pages: Math.ceil(totalSongs / limit),
        },
      };
    });

    // Return successful response
    return sendApiResponse(event, createSuccessResponse(result));
  } catch (error) {
    // Log the error
    songsApiLogger.error(error, "Error fetching songs");

    // Handle any errors
    return sendApiResponse(event, handleApiError(error));
  }
});
