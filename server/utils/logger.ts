import { useRuntimeConfig } from "#imports";
import { pino } from "pino";

// Get environment from runtime config
const config = useRuntimeConfig();
const isDev = config.public.nodeEnv !== "production";

// Configure the logger
const logger = pino({
  level: isDev ? "debug" : "info",
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
        },
      }
    : undefined,
  // Base properties that will be included in all logs
  base: {
    app: "tenx",
    env: config.public.nodeEnv,
  },
});

// Create namespaced loggers for different parts of the application
export const serverLogger = logger.child({ context: "server" });
export const authLogger = logger.child({ module: "auth" });
export const dbLogger = logger.child({ context: "database" });
export const apiLogger = logger.child({ module: "api" });
export const songsApiLogger = logger.child({ module: "api:songs" });

// Default export for general usage
export default logger;
