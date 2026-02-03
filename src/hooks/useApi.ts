// ============================================
// API Hook
// React Query hooks for data fetching
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  ApiResponse,
  User,
  Project,
  CreateProjectInput,
  UpdateProjectInput,
} from '../types';

// --------------------------------------------
// Configuration
// --------------------------------------------

const API_BASE = 'http://localhost:3001/api';

// Demo token - in production, get from auth context
const DEMO_TOKEN = 'session_usr_alice_demo123';

// --------------------------------------------
// Fetch Wrapper
// --------------------------------------------

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DEMO_TOKEN}`,
      ...options.headers,
    },
  });

  const data: ApiResponse<T> = await response.json();

  if (!data.success) {
    throw new Error(data.error?.message || 'Request failed');
  }

  return data.data as T;
}

// --------------------------------------------
// User Hooks
// --------------------------------------------

export function useCurrentUser() {
  return useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => apiFetch<User>('/users/me'),
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => apiFetch<User[]>('/users'),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => apiFetch<User>(`/users/${id}`),
    enabled: !!id,
  });
}

// --------------------------------------------
// Project Hooks
// --------------------------------------------

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => apiFetch<Project[]>('/projects'),
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => apiFetch<Project>(`/projects/${id}`),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProjectInput) =>
      apiFetch<Project>('/projects', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateProjectInput & { id: string }) =>
      apiFetch<Project>(`/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', variables.id] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ deleted: boolean }>(`/projects/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

// --------------------------------------------
// API Key Hooks (Stubs for demo)
// These will be implemented during the demo
// --------------------------------------------

// export function useApiKeys() { ... }
// export function useCreateApiKey() { ... }
// export function useRevokeApiKey() { ... }
