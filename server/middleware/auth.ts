import type { H3Event } from "h3";
import { defineEventHandler, getRequestURL, sendRedirect } from "h3";
import {
  clearSessionCookie,
  setSessionCookie,
  validateSession,
} from "~/server/utils/auth";
import { Config } from "~/server/utils/config";

export default defineEventHandler(async (event: H3Event) => {
  const url = getRequestURL(event);
  const path = url.pathname;
  const sessionCookie = getCookie(event, Config.session.cookie.name);

  // For debugging
  if (process.env.NODE_ENV !== "production") {
    console.log(`Auth middleware triggered for path: ${path}`);
    console.log(`Session cookie exists: ${!!sessionCookie}`);
  }

  // Add auth information to event context
  event.context.auth = {
    authenticated: false,
    userId: null,
  };

  // Special case for auth status endpoint - always allow and let the handler set the response
  const isAuthStatusEndpoint = path === "/api/auth/status";
  if (isAuthStatusEndpoint) {
    if (!sessionCookie) {
      // Just set auth context to false for status endpoint
      if (process.env.NODE_ENV !== "production") {
        console.log("Auth status endpoint called without session");
      }
      return;
    }

    // For status endpoint, validate session but don't return errors
    const { valid, user } = await validateSession(sessionCookie);
    if (valid && user) {
      event.context.auth = {
        authenticated: true,
        userId: user._id,
        username: user.login || null,
      };

      if (process.env.NODE_ENV !== "production") {
        console.log("Auth status: authenticated user", user._id);
      }
    } else if (process.env.NODE_ENV !== "production") {
      console.log("Auth status: invalid session");
    }

    return;
  }

  // Check if the route needs protection
  const isPublicApiRoute = Config.routes.publicApi.some(
    (prefix) => path === prefix || path.startsWith(prefix)
  );

  const isProtectedRoute = Config.routes.protected.some((prefix) =>
    path.startsWith(prefix)
  );

  // Skip auth check for non-protected or public API routes
  if (isPublicApiRoute || !isProtectedRoute) {
    if (process.env.NODE_ENV !== "production") {
      console.log("Skipping auth check for non-protected route");
    }
    return;
  }

  // Handle protected paths when not authenticated
  if (!sessionCookie) {
    if (process.env.NODE_ENV !== "production") {
      console.log("No session cookie found for protected path");
    }

    // For API routes, return 401 error
    if (path.startsWith("/api")) {
      return createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });
    }

    // For non-API routes, redirect to login
    if (process.env.NODE_ENV !== "production") {
      console.log("Non-API protected route, redirecting to login");
    }

    return sendRedirect(event, "/login");
  }

  // Validate the session
  const { valid, user } = await validateSession(sessionCookie);

  if (!valid || !user) {
    if (process.env.NODE_ENV !== "production") {
      console.log("Invalid session, clearing cookie");
    }
    clearSessionCookie(event);

    if (path.startsWith("/api")) {
      return createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });
    }

    // For non-API routes, redirect to login
    if (process.env.NODE_ENV !== "production") {
      console.log("Invalid session, redirecting to login");
    }

    return sendRedirect(event, "/login");
  }

  // Session is valid, check if cookie needs to be refreshed
  // This happens automatically in validateSession, but we need to refresh the cookie
  const session = user.sessions[0];
  const now = Date.now();

  if (now - session.ts_last_usage > Config.session.expiry.refreshInterval) {
    if (process.env.NODE_ENV !== "production") {
      console.log("Refreshing session cookie");
    }
    setSessionCookie(event, sessionCookie);
  }

  // At this point, we know the session is valid. Set authenticated user details in context
  event.context.auth = {
    authenticated: true,
    userId: user._id,
    username: user.login || null,
  };

  if (process.env.NODE_ENV !== "production") {
    console.log("Authentication successful for user:", user._id);
  }
});
