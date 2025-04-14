import { endSession } from "~/server/utils/auth";

export default defineEventHandler(async (event) => {
  try {
    // Get session cookie
    const sessionId = getCookie(event, "session");

    if (sessionId) {
      // End the session (removes from DB and clears cookie)
      await endSession(sessionId, event);
    } else {
      // Still clear the cookie even if no session found
      deleteCookie(event, "session", {
        httpOnly: true,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    return { success: false, error: "An error occurred during logout" };
  }
});
