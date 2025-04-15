import { defineEventHandler } from "h3";
import { SessionService } from "~/server/services/SessionService";
import { createSuccessResponse, sendApiResponse } from "~/server/utils/api";
import { authLogger } from "~/server/utils/logger";

export default defineEventHandler((event) => {
  // Return authentication status from the event context
  // Default to not authenticated if no auth context
  const auth = event.context.auth || {
    authenticated: false,
    userId: null,
    username: null,
  };

  // Add better debug info if not in production
  if (process.env.NODE_ENV !== "production") {
    const sessionService = SessionService.getInstance();
    const sessionCookie = sessionService.getSessionIdFromCookie(event);

    // Log auth status details
    authLogger.debug(
      {
        path: event.path,
        hasCookie: !!sessionCookie,
        authContext: event.context.auth,
        response: {
          authenticated: !!auth.authenticated,
          userId: auth.userId || null,
          username: auth.username || null,
        },
      },
      "Auth status API called"
    );
  }

  // Always return 200 OK with standardized response format
  return sendApiResponse(
    event,
    createSuccessResponse({
      authenticated: !!auth.authenticated,
      userId: auth.userId || null,
      username: auth.username || null,
    })
  );
});
