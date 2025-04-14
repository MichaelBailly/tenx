import { authenticateUser, createSession } from "~/server/utils/auth";

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

    // Authenticate user
    const user = await authenticateUser(username, password);

    if (!user) {
      throw createError({
        statusCode: 401,
        message: "Invalid credentials",
      });
    }

    // Create a new session and set cookie
    await createSession(user._id, event);

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
