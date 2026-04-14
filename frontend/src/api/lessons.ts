import { apiRequest } from './client';
import type { LessonResponse } from './types';

export interface LessonCreate {
  title: string;
  content?: string;
  course_id: number;
  order?: number;
  video_url?: string | null;
  subtitle_url?: string | null;
  has_sign_language?: boolean;
  duration_seconds?: number | null;
  is_demo?: boolean;
}

export interface LessonUpdate {
  title?: string;
  content?: string;
  order?: number;
  video_url?: string | null;
  subtitle_url?: string | null;
  has_sign_language?: boolean;
  duration_seconds?: number | null;
  is_demo?: boolean;
}

export async function listLessonsByCourse(courseId: number): Promise<LessonResponse[]> {
  return apiRequest<LessonResponse[]>(`/courses/${courseId}/lessons`);
}

export async function getLesson(lessonId: number): Promise<LessonResponse> {
  return apiRequest<LessonResponse>(`/lessons/${lessonId}`);
}

export async function createLesson(body: LessonCreate): Promise<LessonResponse> {
  return apiRequest<LessonResponse>('/lessons', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateLesson(lessonId: number, body: LessonUpdate): Promise<LessonResponse> {
  return apiRequest<LessonResponse>(`/lessons/${lessonId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function deleteLesson(lessonId: number): Promise<void> {
  return apiRequest<void>(`/lessons/${lessonId}`, { method: 'DELETE' });
}
