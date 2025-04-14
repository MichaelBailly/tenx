import { AuthService } from "~/server/services/AuthService";

export default defineEventHandler(async (event) => {
  try {
    const authService = AuthService.getInstance();
    const result = await authService.logoutUser(event);

    if (!result.success) {
      return {
        success: false,
        error: result.error || "An error occurred during logout",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    return { success: false, error: "An error occurred during logout" };
  }
});
