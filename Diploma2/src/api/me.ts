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
