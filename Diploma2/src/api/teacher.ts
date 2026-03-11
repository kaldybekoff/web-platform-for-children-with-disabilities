import { apiRequest } from './client';
import type { TeacherStats, TeacherStudentsResponse } from './types';

export async function getTeacherStats(): Promise<TeacherStats> {
  return apiRequest<TeacherStats>('/teacher/stats');
}

export async function getTeacherStudents(): Promise<TeacherStudentsResponse> {
  return apiRequest<TeacherStudentsResponse>('/teacher/students');
}
