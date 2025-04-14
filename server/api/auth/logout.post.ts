import { endSession } from "~/server/utils/auth";
import { Config } from "~/server/utils/config";

export default defineEventHandler(async (event) => {
  try {
    // Get session cookie
    const sessionId = getCookie(event, Config.session.cookie.name);

    if (sessionId) {
      // End the session (removes from DB and clears cookie)
      await endSession(sessionId, event);
    } else {
      // Still clear the cookie even if no session found
      deleteCookie(event, Config.session.cookie.name, {
        httpOnly: Config.session.cookie.httpOnly,
        path: Config.session.cookie.path,
        secure: Config.session.cookie.secure,
        sameSite: Config.session.cookie.sameSite,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    return { success: false, error: "An error occurred during logout" };
  }
});
