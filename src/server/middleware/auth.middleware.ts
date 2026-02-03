// ============================================
// Auth Middleware
// Request authentication and authorization
// ============================================

import type { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import type { AuthContext, ApiResponse } from '../../types';

// --------------------------------------------
// Type Extensions
// --------------------------------------------

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

// --------------------------------------------
// Authentication Middleware
// --------------------------------------------

/**
 * Validate Bearer token and attach auth context to request
 * Returns 401 if token is missing or invalid
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  // Check for Authorization header
  if (!authHeader) {
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authorization header required',
      },
    };
    res.status(401).json(response);
    return;
  }

  // Check for Bearer scheme
  if (!authHeader.startsWith('Bearer ')) {
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Bearer token required',
      },
    };
    res.status(401).json(response);
    return;
  }

  // Extract and validate token
  const token = authHeader.slice(7);
  const result = await authService.validateToken(token);

  if (!result.valid || !result.context) {
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: result.error || 'Invalid token',
      },
    };
    res.status(401).json(response);
    return;
  }

  // Attach auth context to request
  req.auth = result.context;
  next();
}

// --------------------------------------------
// Authorization Middleware
// --------------------------------------------

/**
 * Check if the authenticated user has a specific permission
 * Must be used after requireAuth middleware
 */
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Ensure auth context exists
    if (!req.auth) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      };
      res.status(401).json(response);
      return;
    }

    // Check permission
    if (!authService.hasPermission(req.auth.user, permission)) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Permission denied: ${permission}`,
        },
      };
      res.status(403).json(response);
      return;
    }

    next();
  };
}

/**
 * Require the user to be an admin
 */
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.auth) {
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    };
    res.status(401).json(response);
    return;
  }

  if (req.auth.user.role !== 'admin') {
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Admin access required',
      },
    };
    res.status(403).json(response);
    return;
  }

  next();
}
