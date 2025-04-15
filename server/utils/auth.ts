/**
 * Authentication utilities for handling user authentication operations
 *
 * DEPRECATED: Most functions in this file have been migrated to:
 * - SessionService: For session management (server/services/SessionService.ts)
 * - AuthService: For authentication logic (server/services/AuthService.ts)
 *
 * This file is maintained for backward compatibility and should not be used for new code.
 */

import { AuthService } from "~/server/services/AuthService";
import { SessionService } from "~/server/services/SessionService";

// Re-export AuthService and SessionService for backward compatibility
export { AuthService, SessionService };

// Expose a hashPassword function for backward compatibility
export function hashPassword(password: string): string {
  const authService = AuthService.getInstance();
  return authService.hashPassword(password);
}
