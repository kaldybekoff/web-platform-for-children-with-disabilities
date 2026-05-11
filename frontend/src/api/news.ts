import { apiRequest } from './client';
import type { NewsResponse, NewsListResponse } from './types';

// Public endpoints (for all authenticated users).
// News are created/edited in the separate admin service, not from this app.

export async function listNews(params?: {
  limit?: number;
  offset?: number;
}): Promise<NewsListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.offset) searchParams.set('offset', String(params.offset));

  const query = searchParams.toString();
  return apiRequest<NewsListResponse>(`/news${query ? `?${query}` : ''}`);
}

export async function getNews(newsId: number): Promise<NewsResponse> {
  return apiRequest<NewsResponse>(`/news/${newsId}`);
}
