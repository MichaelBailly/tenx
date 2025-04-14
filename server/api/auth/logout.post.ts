import { SessionService } from "~/server/services/SessionService";

export default defineEventHandler(async (event) => {
  try {
    // Get session service instance
    const sessionService = SessionService.getInstance();

    // Get session cookie
    const sessionId = sessionService.getSessionIdFromCookie(event);

    if (sessionId) {
      // End the session (removes from DB and clears cookie)
      await sessionService.endSession(sessionId, event);
    } else {
      // Still clear the cookie even if no session found
      sessionService.clearSessionCookie(event);
    }

    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    return { success: false, error: "An error occurred during logout" };
  }
});
