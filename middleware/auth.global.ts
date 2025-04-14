/**
 * Global client-side auth middleware
 * This works with the server middleware to handle redirects based on auth status
 */
import { Config } from "~/server/utils/config";

export default defineNuxtRouteMiddleware(async (to) => {
  // Check if the route needs protection
  const isProtectedRoute = Config.routes.protected.some((prefix) =>
    to.path.startsWith(prefix)
  );

  const isPublicRoute = Config.routes.public.some(
    (prefix) => to.path === prefix || to.path.startsWith(prefix)
  );

  // If it's explicitly public or not a protected route, allow access
  if (isPublicRoute || !isProtectedRoute) {
    return;
  }

  // For protected routes - check authentication
  try {
    // Use the auth composable
    const { checkAuth } = useAuth();
    const isAuthenticated = await checkAuth();

    console.log("Auth middleware check result:", isAuthenticated);

    if (!isAuthenticated) {
      console.log("Auth middleware: Not authenticated, redirecting to login");
      return navigateTo("/login");
    }

    console.log(
      "Auth middleware: User is authenticated, allowing access to:",
      to.path
    );
  } catch (error) {
    console.error("Auth middleware error:", error);
    return navigateTo("/login");
  }
});
