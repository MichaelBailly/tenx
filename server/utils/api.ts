/**
 * API utilities for standardized response handling
 */

import type { H3Event } from "h3";
import { setResponseStatus } from "h3";

/**
 * Standard API response structure
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  statusCode?: number;
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(data?: T): ApiResponse<T> {
  return {
    success: true,
    data,
  };
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: string,
  code?: string,
  statusCode = 400
): ApiResponse {
  return {
    success: false,
    error,
    code,
    statusCode,
  };
}

/**
 * Send a standardized API response
 */
export function sendApiResponse<T>(
  event: H3Event,
  response: ApiResponse<T>
): ApiResponse<T> {
  // Set appropriate status code
  const statusCode = response.success ? 200 : response.statusCode || 400;

  setResponseStatus(event, statusCode);

  // Remove statusCode from the response to avoid duplication
  const { statusCode: _, ...cleanResponse } = response;

  return cleanResponse as ApiResponse<T>;
}

/**
 * Handle API errors consistently
 */
export function handleApiError(
  error: unknown,
  defaultMessage = "An unexpected error occurred"
): ApiResponse {
  console.error("API error:", error);

  // Handle H3 errors (createError)
  if (
    error &&
    typeof error === "object" &&
    "statusCode" in error &&
    "message" in error
  ) {
    const h3Error = error as {
      statusCode: number;
      message: string;
      statusMessage?: string;
    };
    return {
      success: false,
      error: h3Error.message || h3Error.statusMessage || defaultMessage,
      statusCode: h3Error.statusCode,
    };
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return {
      success: false,
      error: error.message || defaultMessage,
      statusCode: 500,
    };
  }

  // Handle unknown errors
  return {
    success: false,
    error: defaultMessage,
    statusCode: 500,
  };
}
