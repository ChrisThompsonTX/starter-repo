// ============================================
// Users API
// CRUD operations for user management
// ============================================

import { Router } from 'express';
import { z } from 'zod';
import db, { generateId, now } from '../db';
import { requireAuth, requirePermission } from '../middleware/auth.middleware';
import type { Request, Response } from 'express';
import type { ApiResponse, User, CreateUserInput, UpdateUserInput } from '../../types';

const router = Router();

// --------------------------------------------
// Validation Schemas
// --------------------------------------------

const createUserSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .max(255, 'Email too long'),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name too long'),
  role: z
    .enum(['admin', 'member', 'viewer'])
    .optional()
    .default('member'),
});

const updateUserSchema = z.object({
  name: z
    .string()
    .min(1, 'Name cannot be empty')
    .max(100, 'Name too long')
    .optional(),
  role: z
    .enum(['admin', 'member', 'viewer'])
    .optional(),
  avatarUrl: z
    .string()
    .url('Invalid URL')
    .optional()
    .nullable(),
});

// --------------------------------------------
// Routes
// --------------------------------------------

/**
 * GET /api/users
 * List all users (admin only)
 */
router.get(
  '/',
  requireAuth,
  requirePermission('manage:users'),
  async (_req: Request, res: Response) => {
    const users = Array.from(db.users.values());

    const response: ApiResponse<User[]> = {
      success: true,
      data: users,
    };

    res.json(response);
  }
);

/**
 * GET /api/users/me
 * Get current authenticated user
 */
router.get(
  '/me',
  requireAuth,
  async (req: Request, res: Response) => {
    const response: ApiResponse<User> = {
      success: true,
      data: req.auth!.user,
    };

    res.json(response);
  }
);

/**
 * GET /api/users/:id
 * Get a specific user by ID
 */
router.get(
  '/:id',
  requireAuth,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = db.users.get(id);

    if (!user) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse<User> = {
      success: true,
      data: user,
    };

    res.json(response);
  }
);

/**
 * POST /api/users
 * Create a new user (admin only)
 */
router.post(
  '/',
  requireAuth,
  requirePermission('manage:users'),
  async (req: Request, res: Response) => {
    // Validate input
    const validation = createUserSchema.safeParse(req.body);

    if (!validation.success) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: validation.error.flatten().fieldErrors as Record<string, string[]>,
        },
      };
      res.status(400).json(response);
      return;
    }

    const input: CreateUserInput = validation.data;

    // Check for duplicate email
    for (const existingUser of db.users.values()) {
      if (existingUser.email === input.email) {
        const response: ApiResponse<null> = {
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'A user with this email already exists',
          },
        };
        res.status(409).json(response);
        return;
      }
    }

    // Create user
    const timestamp = now();
    const user: User = {
      id: generateId('usr'),
      email: input.email,
      name: input.name,
      role: input.role || 'member',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    db.users.set(user.id, user);

    const response: ApiResponse<User> = {
      success: true,
      data: user,
    };

    res.status(201).json(response);
  }
);

/**
 * PUT /api/users/:id
 * Update a user
 */
router.put(
  '/:id',
  requireAuth,
  async (req: Request, res: Response) => {
    const { id } = req.params;

    // Check if user exists
    const user = db.users.get(id);
    if (!user) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Check permissions (can only update self unless admin)
    const isSelf = req.auth!.userId === id;
    const isAdmin = req.auth!.user.role === 'admin';

    if (!isSelf && !isAdmin) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Cannot update other users',
        },
      };
      res.status(403).json(response);
      return;
    }

    // Validate input
    const validation = updateUserSchema.safeParse(req.body);

    if (!validation.success) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: validation.error.flatten().fieldErrors as Record<string, string[]>,
        },
      };
      res.status(400).json(response);
      return;
    }

    const input: UpdateUserInput = validation.data;

    // Only admins can change roles
    if (input.role && !isAdmin) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only admins can change user roles',
        },
      };
      res.status(403).json(response);
      return;
    }

    // Update user
    const updatedUser: User = {
      ...user,
      ...input,
      updatedAt: now(),
    };

    db.users.set(id, updatedUser);

    const response: ApiResponse<User> = {
      success: true,
      data: updatedUser,
    };

    res.json(response);
  }
);

/**
 * DELETE /api/users/:id
 * Delete a user (admin only)
 */
router.delete(
  '/:id',
  requireAuth,
  requirePermission('manage:users'),
  async (req: Request, res: Response) => {
    const { id } = req.params;

    // Check if user exists
    const user = db.users.get(id);
    if (!user) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Prevent self-deletion
    if (req.auth!.userId === id) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Cannot delete your own account',
        },
      };
      res.status(403).json(response);
      return;
    }

    db.users.delete(id);

    const response: ApiResponse<{ deleted: boolean }> = {
      success: true,
      data: { deleted: true },
    };

    res.json(response);
  }
);

export default router;
