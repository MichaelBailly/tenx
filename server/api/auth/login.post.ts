import { createHash } from "crypto";
import { MongoClient } from "mongodb";
import type { MongoUser } from "~/types/mongo";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { username, password } = body;

    if (!username || !password) {
      throw createError({
        statusCode: 400,
        message: "Username and password are required",
      });
    }

    // Connect to MongoDB
    const client = new MongoClient(
      process.env.MONGODB_URI || "mongodb://localhost:27017"
    );
    await client.connect();
    const db = client.db("d10");
    const users = db.collection<MongoUser>("users");

    // Hash the password (SHA1)
    const hashedPassword = createHash("sha1").update(password).digest("hex");

    // Find user
    const user = await users.findOne({
      login: username,
      password: hashedPassword,
    });

    if (!user) {
      throw createError({
        statusCode: 401,
        message: "Invalid credentials",
      });
    }

    // Create a new session
    const sessionId = createHash("sha256")
      .update(Math.random().toString())
      .digest("hex");
    const now = Date.now();

    await users.updateOne(
      { _id: user._id },
      {
        $push: {
          sessions: {
            _id: sessionId,
            ts_creation: now,
            ts_last_usage: now,
            lang: "en", // Default language
          },
        },
      }
    );

    // Set session cookie
    setCookie(event, "session", sessionId, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 90, // 3 months in seconds
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax", // Protect against CSRF while allowing normal navigation
    });

    await client.close();

    // Return success without sensitive data
    return {
      success: true,
    };
  } catch (error: unknown) {
    // Don't expose internal errors to client
    if (error instanceof Error && !("statusCode" in error)) {
      console.error("Login error:", error);
      throw createError({
        statusCode: 500,
        message: "An error occurred during login",
      });
    }
    throw error;
  }
});
