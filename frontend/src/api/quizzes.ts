import { apiRequest } from './client';
import type {
  QuizResponse,
  QuizResponseStudent,
  QuestionResponse,
  AnswerResponse,
  QuizResultResponse,
  QuizAttemptResponse,
} from './types';

// Quiz types for create/update
export interface QuizCreate {
  title?: string;
  passing_score?: number;
}

export interface QuizUpdate {
  title?: string;
  passing_score?: number;
}

export interface AnswerCreate {
  text_ru: string;
  text_kz?: string;
  is_correct?: boolean;
  order?: number;
}

export interface QuestionCreate {
  text_ru: string;
  text_kz?: string;
  order?: number;
  answers?: AnswerCreate[];
}

export interface QuestionUpdate {
  text_ru?: string;
  text_kz?: string;
  order?: number;
}

export interface AnswerUpdate {
  text_ru?: string;
  text_kz?: string;
  is_correct?: boolean;
  order?: number;
}

export interface QuizSubmit {
  answers: Record<number, number>; // question_id -> answer_id
}

// ===== Quiz =====

export async function createQuiz(lessonId: number, body: QuizCreate = {}): Promise<QuizResponse> {
  return apiRequest<QuizResponse>(`/lessons/${lessonId}/quiz`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getQuiz(lessonId: number): Promise<QuizResponse | QuizResponseStudent> {
  return apiRequest<QuizResponse | QuizResponseStudent>(`/lessons/${lessonId}/quiz`);
}

export async function updateQuiz(quizId: number, body: QuizUpdate): Promise<QuizResponse> {
  return apiRequest<QuizResponse>(`/quizzes/${quizId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function deleteQuiz(quizId: number): Promise<void> {
  return apiRequest<void>(`/quizzes/${quizId}`, { method: 'DELETE' });
}

// ===== Questions =====

export async function createQuestion(quizId: number, body: QuestionCreate): Promise<QuestionResponse> {
  return apiRequest<QuestionResponse>(`/quizzes/${quizId}/questions`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateQuestion(questionId: number, body: QuestionUpdate): Promise<QuestionResponse> {
  return apiRequest<QuestionResponse>(`/questions/${questionId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function deleteQuestion(questionId: number): Promise<void> {
  return apiRequest<void>(`/questions/${questionId}`, { method: 'DELETE' });
}

// ===== Answers =====

export async function createAnswer(questionId: number, body: AnswerCreate): Promise<AnswerResponse> {
  return apiRequest<AnswerResponse>(`/questions/${questionId}/answers`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateAnswer(answerId: number, body: AnswerUpdate): Promise<AnswerResponse> {
  return apiRequest<AnswerResponse>(`/answers/${answerId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function deleteAnswer(answerId: number): Promise<void> {
  return apiRequest<void>(`/answers/${answerId}`, { method: 'DELETE' });
}

// ===== Check Single Answer =====

export interface CheckAnswerResponse {
  is_correct: boolean;
  correct_answer_id: number;
}

export async function checkAnswer(questionId: number, answerId: number): Promise<CheckAnswerResponse> {
  return apiRequest<CheckAnswerResponse>(`/questions/${questionId}/check`, {
    method: 'POST',
    body: JSON.stringify({ answer_id: answerId }),
  });
}

// ===== Submit & Results =====

export async function submitQuiz(quizId: number, answers: Record<number, number>): Promise<QuizResultResponse> {
  return apiRequest<QuizResultResponse>(`/quizzes/${quizId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  });
}

export async function getMyAttempts(quizId: number): Promise<QuizAttemptResponse[]> {
  return apiRequest<QuizAttemptResponse[]>(`/quizzes/${quizId}/my-attempts`);
}
