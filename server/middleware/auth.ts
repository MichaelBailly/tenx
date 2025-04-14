import type { H3Event } from "h3";
import { defineEventHandler, getRequestURL } from "h3";
import { MongoClient } from "mongodb";

type User = {
  _id: string;
  sessions: {
    _id: string;
    ts_creation: number;
    ts_last_usage: number;
    lang: string;
  }[];
};

// Helper function to create mongo client to avoid repetition
const createMongoClient = () => {
  return new MongoClient(
    process.env.MONGODB_URI || "mongodb://localhost:27017"
  );
};

// Check if the session is valid and return user if found
async function validateSession(sessionId: string): Promise<User | null> {
  let client = null;
  try {
    client = createMongoClient();
    await client.connect();
    const db = client.db("d10");
    const users = db.collection<User>("users");

    // Find user with this session
    const user = await users.findOne(
      { "sessions._id": sessionId },
      { projection: { "sessions.$": 1 } }
    );

    return user;
  } catch (error) {
    console.error("Session validation error:", error);
    return null;
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Update session last usage time if needed
async function updateSessionUsage(
  sessionId: string,
  userId: string
): Promise<void> {
  let client = null;
  try {
    client = createMongoClient();
    await client.connect();
    const db = client.db("d10");
    const users = db.collection<User>("users");

    const now = Date.now();
    await users.updateOne(
      {
        _id: userId,
        "sessions._id": sessionId,
      },
      { $set: { "sessions.$.ts_last_usage": now } }
    );
  } catch (error) {
    console.error("Error updating session usage:", error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

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
  const user = await validateSession(sessionCookie);

  if (!user) {
    console.log("Invalid session, clearing cookie");
    deleteCookie(event, "session");

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

  // Check if session is expired (3 months = 7776000000 ms)
  const session = user.sessions[0];
  const now = Date.now();

  if (now - session.ts_creation > 7776000000) {
    console.log("Session expired, clearing cookie");
    deleteCookie(event, "session");

    if (path.startsWith("/api")) {
      return createError({
        statusCode: 401,
        statusMessage: "Session expired",
      });
    }

    // Just set authentication state to false - client middleware will handle redirect
    event.context.auth = {
      authenticated: false,
      userId: null,
    };
    return;
  }

  // Update session last usage time if it's been more than an hour
  if (now - session.ts_last_usage > 3600000) {
    console.log("Updating session last usage time");
    await updateSessionUsage(sessionCookie, user._id);

    // Refresh the cookie expiration
    setCookie(event, "session", sessionCookie, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 90, // 3 months in seconds
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  }

  // At this point, we know the session is valid. Set authenticated user details in context
  event.context.auth = {
    authenticated: true,
    userId: user._id,
  };

  console.log("Authentication successful for user:", user._id);
});
