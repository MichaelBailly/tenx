import { defineEventHandler, setResponseStatus } from "h3";
import { Config } from "~/server/utils/config";

export default defineEventHandler((event) => {
  // Return authentication status from the event context
  // Default to not authenticated if no auth context
  const auth = event.context.auth || {
    authenticated: false,
    userId: null,
    username: null,
  };

  // Important: Always set 200 OK for the status endpoint even if not authenticated
  // This prevents client-side errors when checking auth status
  setResponseStatus(event, 200);

  // Add better debug info if not in production
  if (process.env.NODE_ENV !== "production") {
    console.log(`Auth status API called for path: ${event.path}`);
    console.log(
      `Session cookie exists: ${!!getCookie(event, Config.session.cookie.name)}`
    );
    console.log(`Auth context: ${JSON.stringify(event.context.auth)}`);
    console.log("Status response:", {
      authenticated: !!auth.authenticated,
      userId: auth.userId || null,
      username: auth.username || null,
    });
  }

  return {
    authenticated: !!auth.authenticated,
    userId: auth.userId || null,
    username: auth.username || null,
  };
});
