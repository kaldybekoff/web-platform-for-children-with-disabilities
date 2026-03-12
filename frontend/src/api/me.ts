import { apiRequest } from './client';
import type { UserResponse, UserUpdate } from './types';

export async function getMe(): Promise<UserResponse> {
  return apiRequest<UserResponse>('/me');
}

export async function updateMe(body: UserUpdate): Promise<UserResponse> {
  return apiRequest<UserResponse>('/me', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
}

export async function changePassword(body: PasswordChangeRequest): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/me/password', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
