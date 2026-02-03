// ============================================
// Auth Service
// Handles authentication, sessions, and permissions
// ============================================

import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import type { User, UserRole, AuthContext } from '../types';

// --------------------------------------------
// Types
// --------------------------------------------

interface ValidateTokenResult {
  valid: boolean;
  context?: AuthContext;
  error?: string;
}

interface PermissionMap {
  [role: string]: string[];
}

// --------------------------------------------
// Configuration
// --------------------------------------------

const SALT_ROUNDS = 10;
const TOKEN_PREFIX = 'session_';

// Role-based permissions
const PERMISSIONS: PermissionMap = {
  admin: ['read', 'write', 'delete', 'manage:users', 'manage:projects', 'manage:api-keys'],
  member: ['read', 'write', 'manage:projects', 'manage:api-keys'],
  viewer: ['read'],
};

// --------------------------------------------
// Auth Service
// --------------------------------------------

class AuthService {
  /**
   * Hash a password for storage
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Compare a password against a hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate a session token
   * In production, use JWT with proper expiration
   */
  generateSessionToken(userId: string): string {
    const sessionId = uuidv4();
    return `${TOKEN_PREFIX}${userId}_${sessionId}`;
  }

  /**
   * Validate a session token and return auth context
   */
  async validateToken(token: string): Promise<ValidateTokenResult> {
    // Check token format
    if (!token || !token.startsWith(TOKEN_PREFIX)) {
      return { valid: false, error: 'Invalid token format' };
    }

    // Extract user ID from token
    // Token format: session_<userId>_<sessionId>
    // Since userId can contain underscores (e.g., usr_alice), we split on the last underscore
    const tokenBody = token.slice(TOKEN_PREFIX.length);
    const lastUnderscoreIndex = tokenBody.lastIndexOf('_');
    
    if (lastUnderscoreIndex === -1) {
      return { valid: false, error: 'Malformed token' };
    }

    const userId = tokenBody.substring(0, lastUnderscoreIndex);
    const sessionId = tokenBody.substring(lastUnderscoreIndex + 1);

    if (!userId || !sessionId) {
      return { valid: false, error: 'Malformed token' };
    }

    // Look up user
    const user = db.users.get(userId);
    if (!user) {
      return { valid: false, error: 'User not found' };
    }

    return {
      valid: true,
      context: {
        userId: user.id,
        user,
        sessionId,
      },
    };
  }

  /**
   * Check if a user has a specific permission
   */
  hasPermission(user: User, permission: string): boolean {
    const userPermissions = PERMISSIONS[user.role] || [];
    return userPermissions.includes(permission);
  }

  /**
   * Get all permissions for a role
   */
  getPermissionsForRole(role: UserRole): string[] {
    return PERMISSIONS[role] || [];
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | undefined> {
    return db.users.get(userId);
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | undefined> {
    for (const user of db.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return undefined;
  }
}

// Export singleton instance
export const authService = new AuthService();
