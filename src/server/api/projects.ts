// ============================================
// Projects API
// CRUD operations for project management
// ============================================

import { Router } from 'express';
import { z } from 'zod';
import db, { generateId, now } from '../db';
import { requireAuth } from '../middleware/auth.middleware';
import type { Request, Response } from 'express';
import type { ApiResponse, Project, CreateProjectInput, UpdateProjectInput } from '../../types';

const router = Router();

// --------------------------------------------
// Validation Schemas
// --------------------------------------------

const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name too long'),
  description: z
    .string()
    .max(500, 'Description too long')
    .optional()
    .default(''),
});

const updateProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Name cannot be empty')
    .max(100, 'Name too long')
    .optional(),
  description: z
    .string()
    .max(500, 'Description too long')
    .optional(),
  status: z
    .enum(['active', 'archived', 'deleted'])
    .optional(),
});

// --------------------------------------------
// Routes
// --------------------------------------------

/**
 * GET /api/projects
 * List projects for the current user
 */
router.get(
  '/',
  requireAuth,
  async (req: Request, res: Response) => {
    const userId = req.auth!.userId;
    const isAdmin = req.auth!.user.role === 'admin';

    // Get projects (admins see all, others see only their own)
    const projects = Array.from(db.projects.values()).filter((p) => {
      if (p.status === 'deleted') return false;
      if (isAdmin) return true;
      return p.ownerId === userId;
    });

    const response: ApiResponse<Project[]> = {
      success: true,
      data: projects,
    };

    res.json(response);
  }
);

/**
 * GET /api/projects/:id
 * Get a specific project
 */
router.get(
  '/:id',
  requireAuth,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const project = db.projects.get(id);

    if (!project || project.status === 'deleted') {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Project not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Check access (owner or admin)
    const isOwner = project.ownerId === req.auth!.userId;
    const isAdmin = req.auth!.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied',
        },
      };
      res.status(403).json(response);
      return;
    }

    const response: ApiResponse<Project> = {
      success: true,
      data: project,
    };

    res.json(response);
  }
);

/**
 * POST /api/projects
 * Create a new project
 */
router.post(
  '/',
  requireAuth,
  async (req: Request, res: Response) => {
    // Validate input
    const validation = createProjectSchema.safeParse(req.body);

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

    const input: CreateProjectInput = validation.data;

    // Create project
    const timestamp = now();
    const project: Project = {
      id: generateId('prj'),
      name: input.name,
      description: input.description || '',
      ownerId: req.auth!.userId,
      status: 'active',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    db.projects.set(project.id, project);

    const response: ApiResponse<Project> = {
      success: true,
      data: project,
    };

    res.status(201).json(response);
  }
);

/**
 * PUT /api/projects/:id
 * Update a project
 */
router.put(
  '/:id',
  requireAuth,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const project = db.projects.get(id);

    if (!project || project.status === 'deleted') {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Project not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Check ownership (only owner or admin can update)
    const isOwner = project.ownerId === req.auth!.userId;
    const isAdmin = req.auth!.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only project owners can update projects',
        },
      };
      res.status(403).json(response);
      return;
    }

    // Validate input
    const validation = updateProjectSchema.safeParse(req.body);

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

    const input: UpdateProjectInput = validation.data;

    // Update project
    const updatedProject: Project = {
      ...project,
      ...input,
      updatedAt: now(),
    };

    db.projects.set(id, updatedProject);

    const response: ApiResponse<Project> = {
      success: true,
      data: updatedProject,
    };

    res.json(response);
  }
);

/**
 * DELETE /api/projects/:id
 * Soft delete a project
 */
router.delete(
  '/:id',
  requireAuth,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const project = db.projects.get(id);

    if (!project || project.status === 'deleted') {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Project not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Check ownership
    const isOwner = project.ownerId === req.auth!.userId;
    const isAdmin = req.auth!.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only project owners can delete projects',
        },
      };
      res.status(403).json(response);
      return;
    }

    // Soft delete
    const updatedProject: Project = {
      ...project,
      status: 'deleted',
      updatedAt: now(),
    };

    db.projects.set(id, updatedProject);

    const response: ApiResponse<{ deleted: boolean }> = {
      success: true,
      data: { deleted: true },
    };

    res.json(response);
  }
);

export default router;
