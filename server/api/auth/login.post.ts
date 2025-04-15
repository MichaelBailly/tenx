import { AuthService } from "~/server/services/AuthService";
import {
  createErrorResponse,
  createSuccessResponse,
  handleApiError,
  sendApiResponse,
} from "~/server/utils/api";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { username, password } = body;

    if (!username || !password) {
      return sendApiResponse(
        event,
        createErrorResponse(
          "Username and password are required",
          "MISSING_CREDENTIALS",
          400
        )
      );
    }

    const authService = AuthService.getInstance();
    const result = await authService.loginUser(username, password, event);

    if (!result.success) {
      return sendApiResponse(
        event,
        createErrorResponse(
          result.error || "Invalid credentials",
          "INVALID_CREDENTIALS",
          401
        )
      );
    }

    // Return success
    return sendApiResponse(event, createSuccessResponse());
  } catch (error) {
    // Handle and standardize error response
    return sendApiResponse(
      event,
      handleApiError(error, "An error occurred during login")
    );
  }
});
