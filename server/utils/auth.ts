import { createHash } from "crypto";
import type { H3Event } from "h3";
import type { MongoUser } from "~/types/mongo";
import { Config } from "./config";
import { DatabaseService } from "./db";

/**
 * Authentication utilities for handling user authentication operations
 */

/**
 * Hash a password using SHA1 (maintaining compatibility with existing data)
 * Note: SHA1 is not recommended for new applications
 */
export function hashPassword(password: string): string {
  return createHash("sha1").update(password).digest("hex");
}

/**
 * Generate a new session ID
 */
export function generateSessionId(): string {
  return createHash("sha256").update(Math.random().toString()).digest("hex");
}

/**
 * Authenticate a user with username and password
 */
export async function authenticateUser(
  username: string,
  password: string
): Promise<MongoUser | null> {
  const db = DatabaseService.getInstance();
  const hashedPassword = hashPassword(password);

  return db.findUserByCredentials(username, hashedPassword);
}

/**
 * Create a new session for a user
 */
export async function createSession(
  userId: string,
  event: H3Event
): Promise<string> {
  const db = DatabaseService.getInstance();

  // Create session ID
  const sessionId = generateSessionId();
  const now = Date.now();

  // Add session to user document
  await db.addUserSession(userId, {
    _id: sessionId,
    ts_creation: now,
    ts_last_usage: now,
    lang: Config.session.defaults.lang,
  });

  // Set session cookie
  setSessionCookie(event, sessionId);

  return sessionId;
}

/**
 * Validate a session and return user if found
 */
export async function validateSession(
  sessionId: string
): Promise<{ valid: boolean; user?: MongoUser }> {
  const db = DatabaseService.getInstance();

  try {
    const user = await db.findUserBySession(sessionId);

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
      await db.updateSessionTimestamp(sessionId, user._id);
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
export async function endSession(
  sessionId: string,
  event: H3Event
): Promise<void> {
  const db = DatabaseService.getInstance();

  if (sessionId) {
    // Remove session from database
    await db.removeSession(sessionId);
  }

  // Clear session cookie
  clearSessionCookie(event);
}

/**
 * Set the session cookie in the response
 */
export function setSessionCookie(event: H3Event, sessionId: string): void {
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
export function clearSessionCookie(event: H3Event): void {
  deleteCookie(event, Config.session.cookie.name, {
    httpOnly: Config.session.cookie.httpOnly,
    path: Config.session.cookie.path,
    secure: Config.session.cookie.secure,
    sameSite: Config.session.cookie.sameSite,
  });
}
