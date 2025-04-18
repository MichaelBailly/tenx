/**
 * PUT /api/v1/songs/[id] endpoint
 * Updates a song's metadata and marks it as reviewed
 */

import { defineEventHandler, getRouterParam, readBody } from "h3";
import {
  createSuccessResponse,
  handleApiError,
  sendApiResponse,
} from "~/server/utils/api";
import { DatabaseService } from "~/server/utils/db";
import { songsApiLogger } from "~/server/utils/logger";
import { tokenizeSong } from "~/server/utils/songs";
import type { MongoSong } from "~/types/mongo";

export default defineEventHandler(async (event) => {
  try {
    // Check if user is authenticated (middleware should already handle this)
    const { userId } = event.context.auth;
    if (!userId) {
      songsApiLogger.warn("Attempt to update song without authentication");
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

    // Get the song to be updated
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

    // Check if the user can edit this song
    if (song.user !== userId) {
      songsApiLogger.warn(
        { songId, userId, songUser: song.user },
        "Unauthorized attempt to edit song"
      );
      return sendApiResponse(event, {
        success: false,
        error: "You are not authorized to edit this song",
        code: "UNAUTHORIZED_EDIT",
        statusCode: 403,
      });
    }

    // Parse request body
    const body = await readBody(event);
    const { title, artist, album, genre, date, tracknumber, reviewed } = body;

    // Basic validation
    if (!title || !artist || !genre) {
      songsApiLogger.warn(
        { songId, title, artist, genre },
        "Missing required fields"
      );
      return sendApiResponse(event, {
        success: false,
        error: "Title, artist, and genre are required",
        code: "MISSING_REQUIRED_FIELDS",
        statusCode: 400,
      });
    }

    // Tokenize the song title and artist
    const tokenized = tokenizeSong({ artist, title });

    // Determine if song is valid (has title, artist, and genre)
    const valid = Boolean(
      title && artist && genre && title !== "" && artist !== "" && genre !== ""
    );

    // Prepare update object
    const updateData: Partial<MongoSong> = {
      title,
      artist,
      genre,
      tokentitle: tokenized.title,
      tokenartists: tokenized.artists,
      valid,
    };

    // Add optional fields if they exist
    if (album !== undefined) {
      updateData.album = album || undefined;
    }

    if (date !== undefined) {
      updateData.date = date || undefined;
    }

    if (tracknumber !== undefined) {
      updateData.tracknumber = tracknumber || undefined;
    }

    if (reviewed !== undefined) {
      updateData.reviewed = Boolean(reviewed);
    }

    // Update the song in the database
    const result = await songsCollection.updateOne(
      { _id: songId },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      songsApiLogger.warn({ songId }, "Song update had no effect");
      return sendApiResponse(event, {
        success: false,
        error: "Song update had no effect",
        code: "UPDATE_FAILED",
        statusCode: 500,
      });
    }

    songsApiLogger.info({ songId, userId }, "Song updated successfully");

    // Return successful response
    return sendApiResponse(event, createSuccessResponse());
  } catch (error) {
    // Log the error
    songsApiLogger.error(error, "Error updating song");

    // Handle any errors
    return sendApiResponse(event, handleApiError(error));
  }
});
