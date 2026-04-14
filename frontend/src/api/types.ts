export type UserRole = 'student' | 'teacher' | 'admin';

export interface UserResponse {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
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
  role?: UserRole;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface UserUpdate {
  first_name?: string;
  last_name?: string;
  email?: string;
}

export interface PasswordChange {
  current_password: string;
  new_password: string;
}

export interface UserAchievementStats {
  completed_lessons: number;
  enrolled_courses: number;
  completed_courses: number;
  passed_quizzes: number;
  perfect_quizzes: number;
}

export interface CourseResponse {
  id: number;
  title: string;
  description: string;
  level: string;
  teacher_id: number;
  image_url: string | null;
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
  is_demo: boolean;
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

export interface StudentQuizStats {
  attempts_count: number;
  passed_count: number;
  best_score: number | null;
  avg_score: number | null;
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
  quiz_stats: StudentQuizStats | null;
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

// News types
export interface NewsResponse {
  id: number;
  title_ru: string;
  title_kz: string;
  content_ru: string;
  content_kz: string;
  video_url: string | null; // legacy
  image_url: string | null; // legacy
  media_url: string | null;
  media_type: 'youtube' | 'image' | null;
  is_published: boolean;
  author_id: number;
  created_at: string;
  updated_at: string;
}

export interface NewsCreate {
  title_ru: string;
  title_kz?: string;
  content_ru: string;
  content_kz?: string;
  media_url?: string | null;
  is_published?: boolean;
}

export interface NewsUpdate {
  title_ru?: string;
  title_kz?: string;
  content_ru?: string;
  content_kz?: string;
  media_url?: string | null;
  is_published?: boolean;
}

export interface NewsListResponse {
  news: NewsResponse[];
  total: number;
}

// Community types
export interface SuccessPostResponse {
  id: number;
  user_id: number;
  author_name: string;
  content: string;
  likes_count: number;
  liked_by_me: boolean;
  created_at: string;
}

export interface SuccessPostCreate {
  content: string;
}

export interface SuccessPostListResponse {
  posts: SuccessPostResponse[];
  total: number;
}

// Study Friends types
export interface StudyFriendResponse {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  common_courses_count: number;
  common_courses: string[];
}

export interface StudyFriendsListResponse {
  friends: StudyFriendResponse[];
  total: number;
}
