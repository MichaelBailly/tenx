/**
 * Pagination-related type definitions
 */

/**
 * Common pagination response format from API endpoints
 */
export type Pagination = {
  total: number; // Total number of items
  page: number; // Current page number
  limit: number; // Items per page
  pages: number; // Total number of pages
};
