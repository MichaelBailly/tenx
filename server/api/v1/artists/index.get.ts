/**
 * GET /api/v1/artists endpoint
 * Retrieves a list of artists from the artists view
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
import type { MongoArtist } from "~/types/mongo";

export default defineEventHandler(async (event) => {
  try {
    // Check if user is authenticated (middleware should already handle this)
    const { userId } = event.context.auth;
    if (!userId) {
      songsApiLogger.warn("Attempt to access artists without authentication");
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

    const sort = (query.sort as string) || "_id";
    const skip = (page - 1) * limit;

    songsApiLogger.debug({ userId, page, limit, sort }, "Fetching artists");

    // Get database service
    const db = DatabaseService.getInstance();

    // Get artists collection (view)
    await db.connect();
    const artistsCollection = db.getCollection<MongoArtist>("artists");

    // Build sort object
    const sortObj: Record<string, 1 | -1> = {};
    if (sort.startsWith("-")) {
      sortObj[sort.substring(1)] = -1;
    } else {
      sortObj[sort] = 1;
    }

    // Count total documents first
    const totalArtists = await artistsCollection.countDocuments();
    const totalPages = Math.ceil(totalArtists / limit);

    // Check if requested page exceeds total pages
    if (page > totalPages && totalArtists > 0) {
      // If the requested page is out of range, redirect to the last page
      return sendApiResponse(event, {
        success: false,
        error: "Page number exceeds available pages",
        code: "PAGE_OUT_OF_RANGE",
        statusCode: 400,
        data: {
          totalPages,
          totalArtists,
        },
      });
    }

    // Get artists with pagination
    const artists = await artistsCollection
      .find({})
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .toArray();

    // Simplify the artist objects for the list view
    const simplifiedArtists = artists.map((artist) => ({
      _id: artist._id,
      count: artist.count,
      duration: artist.duration,
      hits: artist.hits,
      genres: artist.genres,
      ts_creation: artist.ts_creation,
    }));

    songsApiLogger.debug(
      {
        count: simplifiedArtists.length,
        total: totalArtists,
        page,
        totalPages,
      },
      "Artists retrieved successfully"
    );

    const result = {
      artists: simplifiedArtists,
      pagination: {
        total: totalArtists,
        page,
        limit,
        pages: totalPages,
      },
    };

    // Return successful response
    return sendApiResponse(event, createSuccessResponse(result));
  } catch (error) {
    // Log the error
    songsApiLogger.error(error, "Error fetching artists");

    // Handle any errors
    return sendApiResponse(event, handleApiError(error));
  }
});
