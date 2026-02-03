// ============================================
// In-Memory Database
// Simple data store for demo purposes
// In production, replace with PostgreSQL/MySQL
// ============================================

import type { User, Project } from '../types';

// --------------------------------------------
// Database State
// --------------------------------------------

interface Database {
  users: Map<string, User>;
  projects: Map<string, Project>;
  // api_keys table will be added during demo
}

// Initialize with seed data
const db: Database = {
  users: new Map(),
  projects: new Map(),
};

// --------------------------------------------
// Seed Data
// --------------------------------------------

function seedDatabase(): void {
  // Users
  db.users.set('usr_alice', {
    id: 'usr_alice',
    email: 'alice@acme.com',
    name: 'Alice Chen',
    role: 'admin',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  });

  db.users.set('usr_bob', {
    id: 'usr_bob',
    email: 'bob@acme.com',
    name: 'Bob Martinez',
    role: 'member',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
    createdAt: '2024-02-01T14:30:00Z',
    updatedAt: '2024-02-01T14:30:00Z',
  });

  db.users.set('usr_carol', {
    id: 'usr_carol',
    email: 'carol@acme.com',
    name: 'Carol Kim',
    role: 'viewer',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carol',
    createdAt: '2024-02-15T09:00:00Z',
    updatedAt: '2024-02-15T09:00:00Z',
  });

  // Projects
  db.projects.set('prj_website', {
    id: 'prj_website',
    name: 'Marketing Website',
    description: 'Main company marketing site with CMS integration',
    ownerId: 'usr_alice',
    status: 'active',
    createdAt: '2024-01-20T11:00:00Z',
    updatedAt: '2024-03-10T15:30:00Z',
  });

  db.projects.set('prj_mobile', {
    id: 'prj_mobile',
    name: 'Mobile App v2',
    description: 'React Native app for iOS and Android',
    ownerId: 'usr_bob',
    status: 'active',
    createdAt: '2024-02-05T08:00:00Z',
    updatedAt: '2024-03-15T12:00:00Z',
  });

  db.projects.set('prj_api', {
    id: 'prj_api',
    name: 'Public API',
    description: 'REST API for third-party integrations',
    ownerId: 'usr_alice',
    status: 'active',
    createdAt: '2024-02-10T16:00:00Z',
    updatedAt: '2024-03-12T09:45:00Z',
  });

  db.projects.set('prj_legacy', {
    id: 'prj_legacy',
    name: 'Legacy Dashboard',
    description: 'Old admin dashboard - being phased out',
    ownerId: 'usr_alice',
    status: 'archived',
    createdAt: '2023-06-01T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  });
}

// Initialize on module load
seedDatabase();

// --------------------------------------------
// Database Helpers
// --------------------------------------------

export function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}${random}`;
}

export function now(): string {
  return new Date().toISOString();
}

// --------------------------------------------
// Export
// --------------------------------------------

export default db;
