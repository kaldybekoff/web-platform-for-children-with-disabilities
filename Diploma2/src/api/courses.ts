import { apiRequest } from './client';
import type { CourseResponse, EnrollmentResponse, EnrollmentWithCourseResponse } from './types';

export interface CourseCreate {
  title: string;
  description?: string;
  level?: string;
}

export interface CourseUpdate {
  title?: string;
  description?: string;
  level?: string;
}

export async function listCourses(): Promise<CourseResponse[]> {
  return apiRequest<CourseResponse[]>('/courses');
}

export async function getCourse(courseId: number): Promise<CourseResponse> {
  return apiRequest<CourseResponse>(`/courses/${courseId}`);
}

export async function createCourse(body: CourseCreate): Promise<CourseResponse> {
  return apiRequest<CourseResponse>('/courses', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateCourse(courseId: number, body: CourseUpdate): Promise<CourseResponse> {
  return apiRequest<CourseResponse>(`/courses/${courseId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function deleteCourse(courseId: number): Promise<void> {
  return apiRequest<void>(`/courses/${courseId}`, { method: 'DELETE' });
}

export async function enrollInCourse(courseId: number): Promise<EnrollmentResponse> {
  return apiRequest<EnrollmentResponse>(`/courses/${courseId}/enroll`, {
    method: 'POST',
  });
}

export async function myCourses(): Promise<EnrollmentWithCourseResponse[]> {
  return apiRequest<EnrollmentWithCourseResponse[]>('/my-courses');
}
