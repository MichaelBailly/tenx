/**
 * Common type definitions shared across multiple composables
 */

/**
 * Common API error response type
 */
export type ApiError = {
  code?: string;
  data?: {
    totalPages?: number;
    totalSongs?: number;
    totalArtists?: number;
  };
  error?: string;
};

/**
 * Base state properties shared across different feature states
 */
export interface BaseState {
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  limit: number;
  sortField: string;
  sortDirection: "asc" | "desc";
}

/**
 * Generic success response wrapper
 */
export type ApiResponse<T> = {
  success: boolean;
  error?: string;
  data?: T;
};
