import type { Document } from "mongodb";
import { MongoClient } from "mongodb";
import type { MongoUser } from "~/types/mongo";

export default defineEventHandler(async (event) => {
  try {
    // Get session cookie
    const sessionId = getCookie(event, "session");

    if (sessionId) {
      // Connect to MongoDB
      const client = new MongoClient(
        process.env.MONGODB_URI || "mongodb://localhost:27017"
      );
      await client.connect();
      const db = client.db("d10");
      const users = db.collection<MongoUser>("users");

      // Remove the session from the user document
      await users.updateOne({ "sessions._id": sessionId }, {
        $pull: { sessions: { _id: sessionId } },
      } as Document);

      await client.close();
    }

    // Delete the session cookie
    deleteCookie(event, "session", {
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    return { success: false, error: "An error occurred during logout" };
  }
});
