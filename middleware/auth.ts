/**
 * Client-side auth middleware
 * This works with the server middleware to handle redirects based on auth status
 */
export default defineNuxtRouteMiddleware(async (to) => {
  // For login and paths not starting with /app, no protection needed
  if (to.path === "/login" || !to.path.startsWith("/app")) {
    return;
  }

  // For /app routes - check authentication
  try {
    // Check auth status from server
    const { data: authData } = await useFetch("/api/auth/status");

    if (!authData.value?.authenticated) {
      console.log("Client middleware: Not authenticated, redirecting to login");
      return navigateTo("/login");
    }

    console.log("Client middleware: User is authenticated");
  } catch (error) {
    console.error("Auth check error:", error);
    return navigateTo("/login");
  }
});
