import { apiRequest } from './client';

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  body: string;
  lesson_id: number | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationListResponse {
  notifications: NotificationItem[];
  total: number;
  unread_count: number;
}

export async function getNotifications(params?: { limit?: number; offset?: number }): Promise<NotificationListResponse> {
  const p: Record<string, string> = {};
  if (params?.limit) p.limit = String(params.limit);
  if (params?.offset) p.offset = String(params.offset);
  return apiRequest<NotificationListResponse>('/notifications', { params: Object.keys(p).length ? p : undefined });
}

export async function getUnreadCount(): Promise<{ count: number }> {
  return apiRequest<{ count: number }>('/notifications/unread-count');
}

export async function markRead(id: number): Promise<NotificationItem> {
  return apiRequest<NotificationItem>(`/notifications/${id}/read`, { method: 'POST' });
}

export async function markAllRead(): Promise<{ marked: number }> {
  return apiRequest<{ marked: number }>('/notifications/read-all', { method: 'POST' });
}
