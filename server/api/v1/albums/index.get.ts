/**
 * GET /api/v1/albums endpoint
 * Retrieves a list of albums from the albums view
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
import type { MongoSong } from "~/types/mongo";

export default defineEventHandler(async (event) => {
  try {
    // Check if user is authenticated (middleware should already handle this)
    const { userId } = event.context.auth;
    if (!userId) {
      songsApiLogger.warn("Attempt to access albums without authentication");
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

    const skip = (page - 1) * limit;

    songsApiLogger.debug({ userId, page, limit }, "Fetching albums");

    // Get database service
    const db = DatabaseService.getInstance();

    // Get songs collection
    await db.connect();
    const songsCollection = db.getCollection<MongoSong>("songs");

    // Match only songs with albums (not empty or null)
    const pipeline = [
      {
        $match: {
          album: { $exists: true, $ne: "" },
          valid: true,
          reviewed: true,
        },
      },
      {
        $group: {
          _id: "$album",
          songs: { $push: "$$ROOT" },
          songCount: { $sum: 1 },
          totalDuration: { $sum: "$duration" },
          hits: { $sum: "$hits" },
          genres: { $addToSet: "$genre" },
          ts_creation: { $max: "$ts_creation" },
        },
      },
      {
        $project: {
          name: "$_id",
          songCount: 1,
          totalDuration: 1,
          _id: 0,
        },
      },
      { $sort: { name: 1 } },
      {
        $facet: {
          albums: [{ $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const result = await songsCollection.aggregate(pipeline).toArray();
    const albums = result[0].albums;
    const totalAlbums = result[0].totalCount[0]?.count || 0;
    const totalPages = Math.ceil(totalAlbums / limit);

    // Check if requested page exceeds total pages
    if (page > totalPages && totalAlbums > 0) {
      // If the requested page is out of range, redirect to the last page
      return sendApiResponse(event, {
        success: false,
        error: "Page number exceeds available pages",
        code: "PAGE_OUT_OF_RANGE",
        statusCode: 400,
        data: {
          totalPages,
          totalAlbums,
        },
      });
    }

    songsApiLogger.debug(
      {
        count: albums.length,
        total: totalAlbums,
        page,
        totalPages,
      },
      "Albums retrieved successfully"
    );

    const response = {
      albums,
      pagination: {
        total: totalAlbums,
        page,
        limit,
        pages: totalPages,
      },
    };

    // Return successful response
    return sendApiResponse(event, createSuccessResponse(response));
  } catch (error) {
    // Log the error
    songsApiLogger.error(error, "Error fetching albums");

    // Handle any errors
    return sendApiResponse(event, handleApiError(error));
  }
});
