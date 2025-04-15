/**
 * Global client-side auth middleware
 * This works with the server middleware to handle redirects based on auth status
 */
import { useAuthLogger } from "~/composables/useLogger";
import { Config } from "~/server/utils/config";

export default defineNuxtRouteMiddleware(async (to) => {
  // Initialize logger
  const logger = useAuthLogger();

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

    logger.debug(
      { isAuthenticated, path: to.path },
      "Auth middleware check result"
    );

    if (!isAuthenticated) {
      logger.debug("Auth middleware: Not authenticated, redirecting to login");
      return navigateTo("/login");
    }

    logger.debug(
      { path: to.path },
      "Auth middleware: User is authenticated, allowing access"
    );
  } catch (error) {
    logger.error({ err: error, path: to.path }, "Auth middleware error");
    return navigateTo("/login");
  }
});
