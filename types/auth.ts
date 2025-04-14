/**
 * Authentication and Session Types
 * Centralized type definitions for authentication and session management
 */

import type { MongoUser } from "./mongo";

/**
 * User session data stored in the database
 */
export type UserSession = {
  _id: string;
  ts_creation: number;
  ts_last_usage: number;
  lang: string;
};

/**
 * Auth state maintained in client-side contexts
 */
export type AuthState = {
  authenticated: boolean;
  user: ClientUser | null;
  loading: boolean;
  error: string | null;
};

/**
 * Auth response from the status API endpoint
 */
export type AuthResponse = {
  authenticated: boolean;
  userId: string | null;
  username: string | null;
};

/**
 * Client-side user data (stripped of sensitive information)
 */
export type ClientUser = {
  userId: string;
  username: string;
};

/**
 * Authentication context attached to H3Event
 */
export type AuthContext = {
  authenticated: boolean;
  userId: string | null;
  username?: string | null;
};

/**
 * Result of session validation
 */
export type SessionValidationResult = {
  valid: boolean;
  user?: MongoUser;
};

/**
 * Cookie options from config
 */
export type SessionCookieOptions = {
  name: string;
  httpOnly: boolean;
  path: string;
  maxAge: number;
  secure: boolean;
  sameSite: "lax" | "strict" | "none";
};
