/**
 * Client-side auth middleware
 * This works with the server middleware to handle redirects based on auth status
 */
export default defineNuxtRouteMiddleware(async (to) => {
  // Skip auth check for non-protected routes
  if (to.path === "/login" || !to.path.startsWith("/app")) {
    return;
  }

  // For /app routes - check authentication
  try {
    // Use the auth composable
    const { checkAuth } = useAuth();
    const isAuthenticated = await checkAuth();

    console.log("Client middleware auth check result:", isAuthenticated);

    if (!isAuthenticated) {
      console.log("Client middleware: Not authenticated, redirecting to login");
      return navigateTo("/login");
    }

    console.log(
      "Client middleware: User is authenticated, allowing access to:",
      to.path
    );
  } catch (error) {
    console.error("Auth check error:", error);
    return navigateTo("/login");
  }
});
