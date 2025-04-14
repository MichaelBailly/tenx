import { AuthService } from "~/server/services/AuthService";

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

    const authService = AuthService.getInstance();
    const result = await authService.loginUser(username, password, event);

    if (!result.success) {
      throw createError({
        statusCode: 401,
        message: result.error || "Invalid credentials",
      });
    }

    // Return success
    return { success: true };
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
