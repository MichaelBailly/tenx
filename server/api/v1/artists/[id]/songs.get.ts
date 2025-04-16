/**
 * GET /api/v1/artists/[id]/songs endpoint
 * Retrieves all songs for a specific artist
 * Supports pagination and sorting
 */

import { defineEventHandler, getQuery, getRouterParam } from "h3";
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
      songsApiLogger.warn(
        "Attempt to access artist songs without authentication"
      );
      return sendApiResponse(event, {
        success: false,
        error: "Authentication required",
        code: "UNAUTHORIZED",
        statusCode: 401,
      });
    }

    // Get artist ID from URL
    const artistId = getRouterParam(event, "id");
    if (!artistId) {
      songsApiLogger.warn("Missing artist ID parameter");
      return sendApiResponse(event, {
        success: false,
        error: "Missing artist ID",
        code: "MISSING_ARTIST_ID",
        statusCode: 400,
      });
    }

    // Decode the artist ID to handle special characters like spaces
    const decodedArtistId = decodeURIComponent(artistId);

    // Parse query parameters
    const query = getQuery(event);
    const page = parseInt((query.page as string) || "1", 10);
    const limit = Math.min(parseInt((query.limit as string) || "20", 10), 100);

    // Validate page number
    if (isNaN(page) || page < 1) {
      songsApiLogger.warn({ userId, page }, "Invalid page number requested");
      return sendApiResponse(event, {
        success: false,
        error: "Invalid page number",
        code: "INVALID_PAGE",
        statusCode: 400,
      });
    }

    // Validate limit number
    if (isNaN(limit) || limit < 1 || limit > 100) {
      songsApiLogger.warn({ userId, limit }, "Invalid limit requested");
      return sendApiResponse(event, {
        success: false,
        error: "Invalid limit. Must be between 1 and 100",
        code: "INVALID_LIMIT",
        statusCode: 400,
      });
    }

    const sort = (query.sort as string) || "title";
    const skip = (page - 1) * limit;

    songsApiLogger.debug(
      { userId, artistId, page, limit, sort },
      "Fetching songs for artist"
    );

    // Get database service
    const db = DatabaseService.getInstance();

    // Get songs collection
    await db.connect();
    const songsCollection = db.getCollection<MongoSong>("songs");

    // Build sort object
    const sortObj: Record<string, 1 | -1> = {};
    if (sort.startsWith("-")) {
      sortObj[sort.substring(1)] = -1;
    } else {
      sortObj[sort] = 1;
    }

    // Find songs with the artist in tokenartists
    const findQuery = { tokenartists: decodedArtistId };

    // Count total documents first
    const totalSongs = await songsCollection.countDocuments(findQuery);
    const totalPages = Math.ceil(totalSongs / limit);

    // Check if requested page exceeds total pages
    if (page > totalPages && totalSongs > 0) {
      // If the requested page is out of range, redirect to the last page
      return sendApiResponse(event, {
        success: false,
        error: "Page number exceeds available pages",
        code: "PAGE_OUT_OF_RANGE",
        statusCode: 400,
        data: {
          totalPages,
          totalSongs,
        },
      });
    }

    // Get songs with pagination
    const songs = await songsCollection
      .find(findQuery)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .toArray();

    // Enhance songs with canEdit field
    const enhancedSongs = songs.map((song) => {
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
      { count: enhancedSongs.length, total: totalSongs, page, totalPages },
      "Songs for artist retrieved successfully"
    );

    const result = {
      songs: enhancedSongs,
      pagination: {
        total: totalSongs,
        page,
        limit,
        pages: totalPages,
      },
      artist: artistId,
    };

    // Return successful response
    return sendApiResponse(event, createSuccessResponse(result));
  } catch (error) {
    // Log the error
    songsApiLogger.error(error, "Error fetching songs for artist");

    // Handle any errors
    return sendApiResponse(event, handleApiError(error));
  }
});
