// plugins/logger.ts
import { defineNuxtPlugin } from "#app";
import { useLogger } from "~/composables/useLogger";

export default defineNuxtPlugin(() => {
  // Get config to determine environment
  const config = useRuntimeConfig();
  const isDev = config.public.environment !== "production";

  // Create a logger for the plugin context
  const appLogger = useLogger("app");

  // Log application startup
  appLogger.info(
    {
      env: config.public.environment,
      dev: isDev,
    },
    "Application initialized"
  );

  // Return composables to make them automatically available
  return {
    provide: {
      // Provide logger factory functions
      logger: useLogger,
      appLogger: () => useLogger("app"),
      authLogger: () => useLogger("auth"),
      apiLogger: () => useLogger("api"),
    },
  };
});
