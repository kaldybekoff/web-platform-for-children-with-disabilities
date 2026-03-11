import { apiRequest } from './client';
import type { TokenResponse, UserCreate, UserLogin } from './types';

export async function login(body: UserLogin): Promise<TokenResponse> {
  return apiRequest<TokenResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function register(body: UserCreate): Promise<import('./types').UserResponse> {
  return apiRequest<import('./types').UserResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
