/**
 * Application configuration
 * Centralized configuration module that loads environment variables with proper defaults
 */

// Load environment variables with defaults
const getEnv = (key: string, defaultValue: string): string => {
  return process.env[key] || defaultValue;
};

// Get boolean from environment variable
const getEnvBool = (key: string, defaultValue: boolean): boolean => {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === "true";
};

// Get number from environment variable
const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

// Environment
const NODE_ENV = getEnv("NODE_ENV", "development");
const isProduction = NODE_ENV === "production";

export const Config = {
  /**
   * Environment information
   */
  env: {
    nodeEnv: NODE_ENV,
    isProduction,
    isDevelopment: !isProduction,
  },

  /**
   * Server configuration
   */
  server: {
    port: getEnvNumber("PORT", 3000),
    host: getEnv("HOST", "0.0.0.0"),
  },

  /**
   * MongoDB configuration
   */
  mongodb: {
    uri: getEnv("MONGODB_URI", "mongodb://localhost:27017"),
    database: getEnv("MONGODB_DATABASE", "d10"),
    options: {
      maxPoolSize: getEnvNumber("MONGODB_MAX_POOL_SIZE", 10),
      connectTimeoutMS: getEnvNumber("MONGODB_CONNECT_TIMEOUT_MS", 5000),
    },
  },

  /**
   * Session configuration
   */
  session: {
    /**
     * Cookie settings
     */
    cookie: {
      name: getEnv("SESSION_COOKIE_NAME", "session"),
      httpOnly: getEnvBool("SESSION_COOKIE_HTTP_ONLY", true),
      path: getEnv("SESSION_COOKIE_PATH", "/"),
      maxAge: getEnvNumber("SESSION_COOKIE_MAX_AGE", 60 * 60 * 24 * 90), // 3 months in seconds
      secure: getEnvBool("SESSION_COOKIE_SECURE", isProduction),
      sameSite: getEnv("SESSION_COOKIE_SAME_SITE", "lax") as
        | "lax"
        | "strict"
        | "none",
    },

    /**
     * Session expiry times
     */
    expiry: {
      maxAge: getEnvNumber("SESSION_MAX_AGE", 7776000000), // 3 months in milliseconds
      refreshInterval: getEnvNumber("SESSION_REFRESH_INTERVAL", 3600000), // 1 hour in milliseconds
    },

    /**
     * Default session values
     */
    defaults: {
      lang: getEnv("DEFAULT_LANG", "en"),
    },
  },

  /**
   * Storage configuration
   */
  storage: {
    tempDir: getEnv("UPLOAD_TEMP_DIR", "audio/temp"),
    audioDir: getEnv("AUDIO_FILES_DIR", "audio/files"),
    imageDir: getEnv("IMAGE_FILES_DIR", "audio/images"),
  },

  /**
   * Protected routes configuration
   */
  routes: {
    /**
     * Routes that require authentication
     */
    protected: ["/app", "/api", "/audio"],

    /**
     * Routes that don't require authentication
     */
    public: ["/login", "/"],

    /**
     * API routes that don't require authentication
     */
    publicApi: ["/api/auth/login", "/api/auth/logout"],
  },
};

// Export a type for the config
export type AppConfig = typeof Config;
