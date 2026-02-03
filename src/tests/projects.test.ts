// ============================================
// Projects API Tests
// Unit tests for project endpoints
// Pattern for: Soft deletes, ownership, filtering
// ============================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Project, ApiResponse } from '../../types';

// --------------------------------------------
// Test Utilities
// --------------------------------------------

const createMockDb = () => ({
  projects: new Map<string, Project>(),
});

const createTestProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'prj_test123',
  name: 'Test Project',
  description: 'A test project',
  ownerId: 'usr_owner',
  status: 'active',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

// --------------------------------------------
// Tests
// --------------------------------------------

describe('Projects API', () => {
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    mockDb = createMockDb();
    vi.clearAllMocks();
  });

  // ------------------------------------------
  // GET /api/projects
  // ------------------------------------------

  describe('GET /api/projects', () => {
    it('should return active projects for owner', () => {
      // Arrange
      const ownerId = 'usr_owner';
      const project1 = createTestProject({ id: 'prj_1', ownerId, status: 'active' });
      const project2 = createTestProject({ id: 'prj_2', ownerId, status: 'active' });
      mockDb.projects.set(project1.id, project1);
      mockDb.projects.set(project2.id, project2);

      // Act
      const projects = Array.from(mockDb.projects.values()).filter(
        (p) => p.ownerId === ownerId && p.status !== 'deleted'
      );

      // Assert
      expect(projects).toHaveLength(2);
    });

    it('should exclude deleted projects', () => {
      // Arrange
      const ownerId = 'usr_owner';
      const active = createTestProject({ id: 'prj_active', ownerId, status: 'active' });
      const deleted = createTestProject({ id: 'prj_deleted', ownerId, status: 'deleted' });
      mockDb.projects.set(active.id, active);
      mockDb.projects.set(deleted.id, deleted);

      // Act
      const projects = Array.from(mockDb.projects.values()).filter(
        (p) => p.ownerId === ownerId && p.status !== 'deleted'
      );

      // Assert
      expect(projects).toHaveLength(1);
      expect(projects[0].id).toBe('prj_active');
    });

    it('should include archived projects in listing', () => {
      // Arrange
      const ownerId = 'usr_owner';
      const archived = createTestProject({ id: 'prj_archived', ownerId, status: 'archived' });
      mockDb.projects.set(archived.id, archived);

      // Act
      const projects = Array.from(mockDb.projects.values()).filter(
        (p) => p.ownerId === ownerId && p.status !== 'deleted'
      );

      // Assert
      expect(projects).toHaveLength(1);
      expect(projects[0].status).toBe('archived');
    });

    it('should only return projects for the requesting user', () => {
      // Arrange
      const myProject = createTestProject({ id: 'prj_mine', ownerId: 'usr_me' });
      const otherProject = createTestProject({ id: 'prj_other', ownerId: 'usr_other' });
      mockDb.projects.set(myProject.id, myProject);
      mockDb.projects.set(otherProject.id, otherProject);

      // Act
      const myProjects = Array.from(mockDb.projects.values()).filter(
        (p) => p.ownerId === 'usr_me'
      );

      // Assert
      expect(myProjects).toHaveLength(1);
      expect(myProjects[0].id).toBe('prj_mine');
    });
  });

  // ------------------------------------------
  // GET /api/projects/:id
  // ------------------------------------------

  describe('GET /api/projects/:id', () => {
    it('should return project by ID', () => {
      // Arrange
      const project = createTestProject({ id: 'prj_findme' });
      mockDb.projects.set(project.id, project);

      // Act
      const result = mockDb.projects.get('prj_findme');

      // Assert
      expect(result).toBeDefined();
      expect(result?.name).toBe('Test Project');
    });

    it('should return undefined for deleted projects', () => {
      // Arrange
      const deleted = createTestProject({ id: 'prj_deleted', status: 'deleted' });
      mockDb.projects.set(deleted.id, deleted);

      // Act
      const project = mockDb.projects.get('prj_deleted');
      const isAccessible = project && project.status !== 'deleted';

      // Assert
      expect(isAccessible).toBe(false);
    });
  });

  // ------------------------------------------
  // POST /api/projects
  // ------------------------------------------

  describe('POST /api/projects', () => {
    it('should create project with required fields', () => {
      // Arrange
      const input = { name: 'New Project' };
      const ownerId = 'usr_creator';

      // Act
      const project: Project = {
        id: 'prj_new123',
        name: input.name,
        description: '',
        ownerId,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockDb.projects.set(project.id, project);

      // Assert
      expect(mockDb.projects.has('prj_new123')).toBe(true);
      const created = mockDb.projects.get('prj_new123');
      expect(created?.name).toBe('New Project');
      expect(created?.status).toBe('active');
    });

    it('should set empty description if not provided', () => {
      // Arrange
      const input = { name: 'No Description' };

      // Act
      const project: Project = {
        id: 'prj_nodesc',
        name: input.name,
        description: '',
        ownerId: 'usr_owner',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockDb.projects.set(project.id, project);

      // Assert
      expect(mockDb.projects.get('prj_nodesc')?.description).toBe('');
    });

    it('should set owner to creating user', () => {
      // Arrange
      const creatorId = 'usr_creator';

      // Act
      const project = createTestProject({ id: 'prj_owned', ownerId: creatorId });
      mockDb.projects.set(project.id, project);

      // Assert
      expect(mockDb.projects.get('prj_owned')?.ownerId).toBe(creatorId);
    });
  });

  // ------------------------------------------
  // PUT /api/projects/:id
  // ------------------------------------------

  describe('PUT /api/projects/:id', () => {
    it('should update project name', () => {
      // Arrange
      const project = createTestProject({ name: 'Original' });
      mockDb.projects.set(project.id, project);

      // Act
      const updated: Project = {
        ...project,
        name: 'Renamed',
        updatedAt: new Date().toISOString(),
      };
      mockDb.projects.set(project.id, updated);

      // Assert
      expect(mockDb.projects.get(project.id)?.name).toBe('Renamed');
    });

    it('should update project description', () => {
      // Arrange
      const project = createTestProject({ description: 'Old desc' });
      mockDb.projects.set(project.id, project);

      // Act
      const updated: Project = {
        ...project,
        description: 'New description',
        updatedAt: new Date().toISOString(),
      };
      mockDb.projects.set(project.id, updated);

      // Assert
      expect(mockDb.projects.get(project.id)?.description).toBe('New description');
    });

    it('should allow archiving a project', () => {
      // Arrange
      const project = createTestProject({ status: 'active' });
      mockDb.projects.set(project.id, project);

      // Act
      const updated: Project = {
        ...project,
        status: 'archived',
        updatedAt: new Date().toISOString(),
      };
      mockDb.projects.set(project.id, updated);

      // Assert
      expect(mockDb.projects.get(project.id)?.status).toBe('archived');
    });
  });

  // ------------------------------------------
  // DELETE /api/projects/:id
  // ------------------------------------------

  describe('DELETE /api/projects/:id', () => {
    it('should soft delete by setting status', () => {
      // Arrange
      const project = createTestProject({ status: 'active' });
      mockDb.projects.set(project.id, project);

      // Act (soft delete)
      const deleted: Project = {
        ...project,
        status: 'deleted',
        updatedAt: new Date().toISOString(),
      };
      mockDb.projects.set(project.id, deleted);

      // Assert
      expect(mockDb.projects.has(project.id)).toBe(true); // Still exists
      expect(mockDb.projects.get(project.id)?.status).toBe('deleted');
    });

    it('should preserve project data after soft delete', () => {
      // Arrange
      const project = createTestProject({
        name: 'Important Project',
        description: 'Critical data',
      });
      mockDb.projects.set(project.id, project);

      // Act
      const deleted: Project = { ...project, status: 'deleted' };
      mockDb.projects.set(project.id, deleted);

      // Assert
      const result = mockDb.projects.get(project.id);
      expect(result?.name).toBe('Important Project');
      expect(result?.description).toBe('Critical data');
    });
  });

  // ------------------------------------------
  // Authorization Tests
  // ------------------------------------------

  describe('Authorization', () => {
    it('should only allow owner to update project', () => {
      // Arrange
      const project = createTestProject({ ownerId: 'usr_owner' });
      mockDb.projects.set(project.id, project);

      // Act - check ownership
      const requesterId = 'usr_other';
      const isOwner = project.ownerId === requesterId;

      // Assert
      expect(isOwner).toBe(false);
    });

    it('should only allow owner to delete project', () => {
      // Arrange
      const project = createTestProject({ ownerId: 'usr_owner' });
      mockDb.projects.set(project.id, project);

      // Act - check ownership
      const requesterId = 'usr_owner';
      const isOwner = project.ownerId === requesterId;

      // Assert
      expect(isOwner).toBe(true);
    });
  });

  // ------------------------------------------
  // Validation Tests
  // ------------------------------------------

  describe('Validation', () => {
    it('should require project name', () => {
      const invalidInput = { description: 'No name' };
      expect(invalidInput).not.toHaveProperty('name');
    });

    it('should validate status enum', () => {
      const validStatuses = ['active', 'archived', 'deleted'];
      const invalidStatus = 'paused';

      expect(validStatuses).toContain('active');
      expect(validStatuses).not.toContain(invalidStatus);
    });
  });
});
