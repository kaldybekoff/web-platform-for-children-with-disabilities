import { apiRequest } from './client';

export interface CommentResponse {
  id: number;
  lesson_id: number;
  user_id: number;
  parent_id: number | null;
  content: string;
  author_name: string;
  author_role: string;
  created_at: string;
  replies: CommentResponse[];
}

export async function listComments(lessonId: number): Promise<CommentResponse[]> {
  return apiRequest<CommentResponse[]>(`/lessons/${lessonId}/comments`);
}

export async function createComment(
  lessonId: number,
  content: string,
  parentId?: number,
): Promise<CommentResponse> {
  return apiRequest<CommentResponse>(`/lessons/${lessonId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content, parent_id: parentId ?? null }),
  });
}

export async function deleteComment(commentId: number): Promise<void> {
  return apiRequest<void>(`/comments/${commentId}`, { method: 'DELETE' });
}
