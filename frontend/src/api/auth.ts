import { apiRequest } from './client';
import type { TokenResponse, UserCreate, UserLogin } from './types';

export interface RegisterResponse {
  message: string;
  email: string;
}

export async function login(body: UserLogin): Promise<TokenResponse> {
  return apiRequest<TokenResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function register(body: UserCreate): Promise<RegisterResponse> {
  return apiRequest<RegisterResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function resendVerification(email: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, new_password: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, new_password }),
  });
}
