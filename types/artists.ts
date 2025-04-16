/**
 * Artist-related type definitions
 */
import type { ApiSong } from "./api";
import type { BaseState } from "./common";
import type { Pagination } from "./pagination";

/**
 * Artist entity
 */
export type Artist = {
  _id: string;
  count: number; // Number of songs by the artist
  duration: number; // Total duration of all songs
  hits: number; // Total play count
  genres: string[]; // List of genres associated with the artist
  ts_creation: number; // Timestamp of creation
};

/**
 * Artist list state
 */
export interface ArtistsState extends BaseState {
  artists: Artist[];
  totalArtists: number;
}

/**
 * Artist songs state
 */
export interface ArtistSongsState extends BaseState {
  songs: ApiSong[];
  totalSongs: number;
  artistId: string | null;
}

/**
 * Response from the artists API endpoint
 */
export type ArtistsApiResponse = {
  success: boolean;
  error?: string;
  data?: {
    artists: Artist[];
    pagination: Pagination;
  };
};

/**
 * Response from the artist songs API endpoint
 */
export type ArtistSongsApiResponse = {
  success: boolean;
  error?: string;
  data?: {
    songs: ApiSong[];
    pagination: Pagination;
    artist: string;
  };
};
