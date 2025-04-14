import type { H3Event } from "h3";
import { defineEventHandler, getRequestURL } from "h3";
import {
  clearSessionCookie,
  setSessionCookie,
  validateSession,
} from "~/server/utils/auth";

export default defineEventHandler(async (event: H3Event) => {
  const url = getRequestURL(event);
  const path = url.pathname;
  const sessionCookie = getCookie(event, "session");

  console.log(`Auth middleware triggered for path: ${path}`);
  console.log(`Session cookie exists: ${!!sessionCookie}`);

  // Add auth information to event context
  event.context.auth = {
    authenticated: false,
    userId: null,
  };

  // Skip auth check for non-protected routes except the status endpoint
  if (
    (path.startsWith("/api/auth") && path !== "/api/auth/status") ||
    path === "/login" ||
    (!path.startsWith("/app") && !path.startsWith("/api"))
  ) {
    console.log("Skipping auth check for non-protected route");
    return;
  }

  // Handle protected paths when not authenticated
  if (!sessionCookie) {
    console.log("No session cookie found for protected path");

    // For API routes, return 401 error
    if (path.startsWith("/api")) {
      return createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });
    }

    // For other routes, just set auth context to false - client middleware will handle redirect
    event.context.auth = {
      authenticated: false,
      userId: null,
    };
    return;
  }

  // Validate the session
  const { valid, user } = await validateSession(sessionCookie);

  if (!valid || !user) {
    console.log("Invalid session, clearing cookie");
    clearSessionCookie(event);

    if (path.startsWith("/api")) {
      return createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });
    }

    // Just set authentication state to false - client middleware will handle redirect
    event.context.auth = {
      authenticated: false,
      userId: null,
    };
    return;
  }

  // Session is valid, check if cookie needs to be refreshed
  // This happens automatically in validateSession, but we need to refresh the cookie
  const session = user.sessions[0];
  const now = Date.now();

  if (now - session.ts_last_usage > 3600000) {
    console.log("Refreshing session cookie");
    setSessionCookie(event, sessionCookie);
  }

  // At this point, we know the session is valid. Set authenticated user details in context
  event.context.auth = {
    authenticated: true,
    userId: user._id,
  };

  console.log("Authentication successful for user:", user._id);
});
