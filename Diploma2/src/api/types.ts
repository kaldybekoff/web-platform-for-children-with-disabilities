export type UserRole = 'student' | 'teacher' | 'admin';

export interface UserResponse {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

export interface UserCreate {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: UserRole;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface UserUpdate {
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
}

export interface CourseResponse {
  id: number;
  title: string;
  description: string;
  level: string;
  teacher_id: number;
  created_at: string;
}

export interface LessonResponse {
  id: number;
  title: string;
  content: string;
  course_id: number;
  order: number;
  video_url: string | null;
  subtitle_url: string | null;
  has_sign_language: boolean;
  duration_seconds: number | null;
  created_at: string | null;
  updated_at: string | null;
}

// Quiz types
export interface AnswerResponse {
  id: number;
  question_id: number;
  text_ru: string;
  text_kz: string;
  is_correct: boolean;
  order: number;
}

export interface AnswerResponseStudent {
  id: number;
  question_id: number;
  text_ru: string;
  text_kz: string;
  order: number;
}

export interface QuestionResponse {
  id: number;
  quiz_id: number;
  text_ru: string;
  text_kz: string;
  order: number;
  answers: AnswerResponse[];
}

export interface QuestionResponseStudent {
  id: number;
  quiz_id: number;
  text_ru: string;
  text_kz: string;
  order: number;
  answers: AnswerResponseStudent[];
}

export interface QuizResponse {
  id: number;
  lesson_id: number;
  title: string;
  passing_score: number;
  created_at: string;
  questions: QuestionResponse[];
}

export interface QuizResponseStudent {
  id: number;
  lesson_id: number;
  title: string;
  passing_score: number;
  questions: QuestionResponseStudent[];
}

export interface QuizResultResponse {
  attempt_id: number;
  score: number;
  passed: boolean;
  total_questions: number;
  correct_answers: number;
}

export interface QuizAttemptResponse {
  id: number;
  quiz_id: number;
  student_id: number;
  score: number;
  passed: boolean;
  started_at: string;
  completed_at: string | null;
}

// Progress types
export interface LessonProgressResponse {
  id: number;
  student_id: number;
  lesson_id: number;
  completed: boolean;
  completed_at: string | null;
  watch_time_seconds: number;
}

// Admin types
export interface AdminStats {
  total_users: number;
  total_students: number;
  total_teachers: number;
  total_admins: number;
  total_courses: number;
  total_lessons: number;
  total_enrollments: number;
  completed_lessons: number;
}

export interface UserListResponse {
  users: UserResponse[];
  total: number;
  page: number;
  per_page: number;
}

// Teacher types
export interface TeacherStats {
  total_courses: number;
  total_lessons: number;
  total_students: number;
  average_progress: number;
}

export interface StudentWithProgress {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  course_id: number;
  course_title: string;
  progress: number;
  enrolled_at: string;
}

export interface TeacherStudentsResponse {
  students: StudentWithProgress[];
  total: number;
}

export interface EnrollmentResponse {
  id: number;
  student_id: number;
  course_id: number;
  progress: number;
  created_at: string;
}

export interface EnrollmentWithCourseResponse extends EnrollmentResponse {
  course_title: string;
  course_level: string;
}
