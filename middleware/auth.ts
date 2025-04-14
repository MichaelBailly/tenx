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

export default defineNuxtRouteMiddleware(async (to) => {
  const event = useRequestEvent();

  // Skip auth check for login page
  if (to.path === "/login") {
    return;
  }

  const cookie = useCookie("session");
  if (!cookie.value) {
    return navigateTo("/login");
  }

  try {
    // Verify session exists in database
    const client = new MongoClient(
      process.env.MONGODB_URI || "mongodb://localhost:27017"
    );
    await client.connect();
    const db = client.db("d10");
    const users = db.collection<User>("users");

    // Find user and get session details
    const user = await users.findOne(
      { "sessions._id": cookie.value },
      { projection: { "sessions.$": 1 } }
    );

    await client.close();

    if (!user) {
      // Invalid session, clear cookie and redirect to login
      cookie.value = null;
      return navigateTo("/login");
    }

    const session = user.sessions[0];
    const now = Date.now();

    // Check if session is expired (3 months = 7776000000 ms)
    if (now - session.ts_creation > 7776000000) {
      cookie.value = null;
      return navigateTo("/login");
    }

    // Update session last usage time if it's been more than an hour
    if (now - session.ts_last_usage > 3600000) {
      await users.updateOne(
        { "sessions._id": cookie.value },
        { $set: { "sessions.$.ts_last_usage": now } }
      );

      // Also refresh the cookie to extend its expiry
      if (event) {
        setCookie(event, "session", cookie.value, {
          httpOnly: true,
          path: "/",
          maxAge: 60 * 60 * 24 * 90, // 3 months in seconds
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        });
      }
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    return navigateTo("/login");
  }
});
