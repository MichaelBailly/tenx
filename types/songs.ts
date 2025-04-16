/**
 * Song-related type definitions
 */
import type { ApiSong } from "./api";
import type { BaseState } from "./common";
import type { Pagination } from "./pagination";

/**
 * Songs list state
 */
export interface SongsState extends BaseState {
  songs: ApiSong[];
  totalSongs: number;
}

/**
 * Response from the songs API endpoint
 */
export type SongsApiResponse = {
  success: boolean;
  error?: string;
  data?: {
    songs: ApiSong[];
    pagination: Pagination;
  };
};
