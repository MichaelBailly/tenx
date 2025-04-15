import { AuthService } from "~/server/services/AuthService";
import {
  createErrorResponse,
  createSuccessResponse,
  handleApiError,
  sendApiResponse,
} from "~/server/utils/api";

export default defineEventHandler(async (event) => {
  try {
    const authService = AuthService.getInstance();
    const result = await authService.logoutUser(event);

    if (!result.success) {
      return sendApiResponse(
        event,
        createErrorResponse(
          result.error || "An error occurred during logout",
          "LOGOUT_FAILED",
          400
        )
      );
    }

    return sendApiResponse(event, createSuccessResponse());
  } catch (error) {
    return sendApiResponse(
      event,
      handleApiError(error, "An error occurred during logout")
    );
  }
});
