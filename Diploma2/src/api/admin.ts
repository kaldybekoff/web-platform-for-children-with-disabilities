import { apiRequest } from './client';
import type { AdminStats, UserListResponse, UserResponse, UserUpdate } from './types';

export async function getAdminStats(): Promise<AdminStats> {
  return apiRequest<AdminStats>('/admin/stats');
}

export async function listUsers(params?: {
  page?: number;
  per_page?: number;
  role?: string;
  search?: string;
}): Promise<UserListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.per_page) searchParams.set('per_page', String(params.per_page));
  if (params?.role) searchParams.set('role', params.role);
  if (params?.search) searchParams.set('search', params.search);
  
  const query = searchParams.toString();
  return apiRequest<UserListResponse>(`/admin/users${query ? `?${query}` : ''}`);
}

export async function getUser(userId: number): Promise<UserResponse> {
  return apiRequest<UserResponse>(`/admin/users/${userId}`);
}

export async function updateUser(userId: number, body: UserUpdate): Promise<UserResponse> {
  return apiRequest<UserResponse>(`/admin/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function updateUserRole(userId: number, role: string): Promise<UserResponse> {
  return apiRequest<UserResponse>(`/admin/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export async function deleteUser(userId: number): Promise<void> {
  return apiRequest<void>(`/admin/users/${userId}`, { method: 'DELETE' });
}
