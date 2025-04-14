/**
 * SessionService
 * Responsible for managing user sessions, including creation, validation, and termination
 */

import { createHash } from "crypto";
import type { H3Event } from "h3";
import { deleteCookie, getCookie, setCookie } from "h3";
import { Config } from "~/server/utils/config";
import { DatabaseService } from "~/server/utils/db";
import type { SessionValidationResult } from "~/types/auth";

/**
 * Service for managing user sessions
 */
export class SessionService {
  private static instance: SessionService;
  private db: DatabaseService;

  private constructor() {
    this.db = DatabaseService.getInstance();
  }

  /**
   * Get the singleton instance of the SessionService
   */
  public static getInstance(): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService();
    }
    return SessionService.instance;
  }

  /**
   * Generate a new session ID
   */
  public generateSessionId(): string {
    return createHash("sha256").update(Math.random().toString()).digest("hex");
  }

  /**
   * Create a new session for a user
   */
  public async createSession(userId: string, event: H3Event): Promise<string> {
    // Create session ID
    const sessionId = this.generateSessionId();
    const now = Date.now();

    // Add session to user document
    await this.db.addUserSession(userId, {
      _id: sessionId,
      ts_creation: now,
      ts_last_usage: now,
      lang: Config.session.defaults.lang,
    });

    // Set session cookie
    this.setSessionCookie(event, sessionId);

    return sessionId;
  }

  /**
   * Validate a session and return user if found
   */
  public async validateSession(
    sessionId: string
  ): Promise<SessionValidationResult> {
    try {
      const user = await this.db.findUserBySession(sessionId);

      if (!user) {
        return { valid: false };
      }

      // Check if session is expired
      const session = user.sessions[0];
      const now = Date.now();

      if (now - session.ts_creation > Config.session.expiry.maxAge) {
        return { valid: false };
      }

      // Check if session needs refresh
      if (now - session.ts_last_usage > Config.session.expiry.refreshInterval) {
        await this.db.updateSessionTimestamp(sessionId, user._id);
      }

      return { valid: true, user };
    } catch (error) {
      console.error("Session validation error:", error);
      return { valid: false };
    }
  }

  /**
   * End a user session
   */
  public async endSession(sessionId: string, event: H3Event): Promise<void> {
    if (sessionId) {
      // Remove session from database
      await this.db.removeSession(sessionId);
    }

    // Clear session cookie
    this.clearSessionCookie(event);
  }

  /**
   * Set the session cookie in the response
   */
  public setSessionCookie(event: H3Event, sessionId: string): void {
    setCookie(event, Config.session.cookie.name, sessionId, {
      httpOnly: Config.session.cookie.httpOnly,
      path: Config.session.cookie.path,
      maxAge: Config.session.cookie.maxAge,
      secure: Config.session.cookie.secure,
      sameSite: Config.session.cookie.sameSite,
    });
  }

  /**
   * Clear the session cookie from the response
   */
  public clearSessionCookie(event: H3Event): void {
    deleteCookie(event, Config.session.cookie.name, {
      httpOnly: Config.session.cookie.httpOnly,
      path: Config.session.cookie.path,
      secure: Config.session.cookie.secure,
      sameSite: Config.session.cookie.sameSite,
    });
  }

  /**
   * Get the session ID from the request cookies
   */
  public getSessionIdFromCookie(event: H3Event): string | undefined {
    return getCookie(event, Config.session.cookie.name);
  }
}
