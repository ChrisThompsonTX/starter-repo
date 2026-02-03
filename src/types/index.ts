// ============================================
// Shared Types
// All domain types and API contracts
// ============================================

// --------------------------------------------
// API Response Types (RFC 7807 inspired)
// --------------------------------------------

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface ResponseMeta {
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
}

// --------------------------------------------
// User Types
// --------------------------------------------

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'admin' | 'member' | 'viewer';

export interface CreateUserInput {
  email: string;
  name: string;
  role?: UserRole;
}

export interface UpdateUserInput {
  name?: string;
  role?: UserRole;
  avatarUrl?: string;
}

// --------------------------------------------
// Project Types
// --------------------------------------------

export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export type ProjectStatus = 'active' | 'archived' | 'deleted';

export interface CreateProjectInput {
  name: string;
  description?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: ProjectStatus;
}

// --------------------------------------------
// Auth Types
// --------------------------------------------

export interface AuthContext {
  userId: string;
  user: User;
  sessionId: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  expiresAt: string;
}

// --------------------------------------------
// API Key Types (TO BE IMPLEMENTED)
// --------------------------------------------

// These types are stubs for the feature we'll build in the demo
// Agents will reference these when creating the implementation

export type ApiKeyScope = 'read' | 'write' | 'admin';

export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  keyPrefix: string;      // e.g., "sk_live_abc123" (visible part)
  scopes: ApiKeyScope[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  revokedAt: string | null;
}

export interface CreateApiKeyInput {
  name: string;
  scopes: ApiKeyScope[];
  expiresInDays?: number;
}

export interface CreateApiKeyResponse {
  apiKey: ApiKey;
  rawKey: string;  // Only returned once at creation, never stored
}
