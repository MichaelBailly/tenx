/**
 * Application configuration
 */
export const Config = {
  /**
   * MongoDB configuration
   */
  mongodb: {
    uri: process.env.MONGODB_URI || "mongodb://localhost:27017",
    database: "d10",
  },

  /**
   * Session configuration
   */
  session: {
    /**
     * Cookie settings
     */
    cookie: {
      name: "session",
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 90, // 3 months in seconds
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const, // Protect against CSRF while allowing normal navigation
    },

    /**
     * Session expiry times
     */
    expiry: {
      maxAge: 7776000000, // 3 months in milliseconds
      refreshInterval: 3600000, // 1 hour in milliseconds
    },

    /**
     * Default session values
     */
    defaults: {
      lang: "en",
    },
  },

  /**
   * Protected routes configuration
   */
  routes: {
    /**
     * Routes that require authentication
     */
    protected: ["/app", "/api"],

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
