import pino from "pino";
import { ref } from "vue";

export function useLogger(context = "client") {
  const config = useRuntimeConfig();
  const isDev = config.public.environment !== "production";

  // Create once and cache the logger instance
  const loggerRef = ref<ReturnType<typeof pino>>();

  if (!loggerRef.value) {
    // Create browser logger with appropriate level based on environment
    loggerRef.value = pino({
      level: isDev ? "debug" : "info",
      browser: {
        asObject: true,
        transmit: {
          level: "error",
          send: (level, logEvent) => {
            // In a real app, you might want to send errors to a server endpoint
            if (level === "error" || level === "fatal") {
              console.error("Error logs would be sent to server:", logEvent);
            }
          },
        },
      },
    }).child({ context });
  }

  return loggerRef.value;
}

// Export common contexts for convenience
export function useAuthLogger() {
  return useLogger("auth");
}

export function useAppLogger() {
  return useLogger("app");
}

export function useApiLogger() {
  return useLogger("api");
}
