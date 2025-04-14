import { MongoClient } from "mongodb";

export default defineNuxtRouteMiddleware(async (to) => {
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
    const db = client.db("tenx");
    const users = db.collection("users");

    const user = await users.findOne({
      "sessions._id": cookie.value,
    });

    await client.close();

    if (!user) {
      // Invalid session, clear cookie and redirect to login
      cookie.value = null;
      return navigateTo("/login");
    }

    // Update session last usage time
    const now = Date.now();
    await users.updateOne(
      { "sessions._id": cookie.value },
      { $set: { "sessions.$.ts_last_usage": now } }
    );
  } catch (error) {
    console.error("Auth middleware error:", error);
    return navigateTo("/login");
  }
});
