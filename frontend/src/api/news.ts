import { apiRequest } from './client';
import type { NewsResponse, NewsListResponse } from './types';

// Public endpoints (for all authenticated users).
// News are created/edited in the separate admin service, not from this app.

export async function listNews(params?: {
  limit?: number;
  offset?: number;
  search?: string;
}): Promise<NewsListResponse> {
  const p: Record<string, string> = {};
  if (params?.limit) p.limit = String(params.limit);
  if (params?.offset) p.offset = String(params.offset);
  if (params?.search?.trim()) p.search = params.search.trim();
  return apiRequest<NewsListResponse>('/news', { params: Object.keys(p).length ? p : undefined });
}

export async function getNews(newsId: number): Promise<NewsResponse> {
  return apiRequest<NewsResponse>(`/news/${newsId}`);
}
