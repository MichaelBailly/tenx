import { defineEventHandler } from "h3";

export default defineEventHandler((event) => {
  // Return authentication status from the event context
  // Default to not authenticated if no auth context
  const auth = event.context.auth || { authenticated: false, userId: null };

  // Add better debug info
  console.log(`Auth status API called for path: ${event.path}`);
  console.log(`Session cookie exists: ${!!getCookie(event, "session")}`);
  console.log(`Auth context: ${JSON.stringify(event.context.auth)}`);
  console.log("Status response:", {
    authenticated: !!auth.authenticated,
    userId: auth.userId || null,
  });

  return {
    authenticated: !!auth.authenticated,
    userId: auth.userId || null,
  };
});
