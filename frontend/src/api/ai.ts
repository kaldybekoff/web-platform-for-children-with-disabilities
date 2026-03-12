import { apiRequest } from './client';

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  reply: string;
}

export async function sendAIMessage(message: string): Promise<ChatResponse> {
  return apiRequest<ChatResponse>('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}
