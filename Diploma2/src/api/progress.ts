import { apiRequest } from './client';
import type { LessonProgressResponse } from './types';

export interface MarkLessonComplete {
  watch_time_seconds?: number;
}

export async function markLessonComplete(
  lessonId: number,
  body: MarkLessonComplete = {}
): Promise<LessonProgressResponse> {
  return apiRequest<LessonProgressResponse>(`/lessons/${lessonId}/complete`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getLessonProgress(lessonId: number): Promise<LessonProgressResponse | null> {
  return apiRequest<LessonProgressResponse | null>(`/lessons/${lessonId}/progress`);
}

export async function getCourseProgress(courseId: number): Promise<LessonProgressResponse[]> {
  return apiRequest<LessonProgressResponse[]>(`/courses/${courseId}/my-progress`);
}
