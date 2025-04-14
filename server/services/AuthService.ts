/**
 * AuthService
 * Responsible for user authentication operations
 */

import { createHash } from "crypto";
import type { H3Event } from "h3";
import { DatabaseService } from "~/server/utils/db";
import type { MongoUser } from "~/types/mongo";
import { SessionService } from "./SessionService";

/**
 * Service for handling user authentication
 */
export class AuthService {
  private static instance: AuthService;
  private db: DatabaseService;
  private sessionService: SessionService;

  private constructor() {
    this.db = DatabaseService.getInstance();
    this.sessionService = SessionService.getInstance();
  }

  /**
   * Get the singleton instance of the AuthService
   */
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Hash a password using SHA1 (maintaining compatibility with existing data)
   * Note: SHA1 is not recommended for new applications
   */
  public hashPassword(password: string): string {
    return createHash("sha1").update(password).digest("hex");
  }

  /**
   * Authenticate a user with username and password
   */
  public async authenticateUser(
    username: string,
    password: string
  ): Promise<MongoUser | null> {
    const hashedPassword = this.hashPassword(password);
    return this.db.findUserByCredentials(username, hashedPassword);
  }

  /**
   * Login a user and create a session
   */
  public async loginUser(
    username: string,
    password: string,
    event: H3Event
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Authenticate user
      const user = await this.authenticateUser(username, password);

      if (!user) {
        return { success: false, error: "Invalid credentials" };
      }

      // Create a new session
      await this.sessionService.createSession(user._id, event);

      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error during login",
      };
    }
  }

  /**
   * Logout a user by ending their session
   */
  public async logoutUser(
    event: H3Event
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const sessionId = this.sessionService.getSessionIdFromCookie(event);

      if (sessionId) {
        await this.sessionService.endSession(sessionId, event);
      } else {
        this.sessionService.clearSessionCookie(event);
      }

      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error during logout",
      };
    }
  }
}
