import { useState } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { CoursesSection } from './components/CoursesSection';
import { FeaturesSection } from './components/FeaturesSection';
import { InteractiveLessonDemo } from './components/InteractiveLessonDemo';
import { UserProfile } from './components/UserProfile';
import { CommunityPage } from './components/CommunityPage';
import { AuthPage } from './components/AuthPage';
import { TeacherDashboard } from './components/TeacherDashboard';
import { TeacherCourses } from './components/TeacherCourses';
import { TeacherStudents } from './components/TeacherStudents';
import { TeacherProfile } from './components/TeacherProfile';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminUsers } from './components/AdminUsers';
import { AdminCourses } from './components/AdminCourses';
import { AdminStats } from './components/AdminStats';
import { AdminCommunity } from './components/AdminCommunity';
import { Footer } from './components/Footer';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import type { UserRole } from './api/types';

const defaultSectionByRole: Record<UserRole, string> = {
  student: 'home',
  teacher: 'dashboard',
  admin: 'dashboard',
};

function AppContent() {
  const { isAuthenticated, userRole, logout, loading } = useAuth();
  const [activeSection, setActiveSection] = useState('home');
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);

  const openLesson = (courseId: number, lessonId?: number) => {
    setSelectedCourseId(courseId);
    setSelectedLessonId(lessonId ?? null);
    setActiveSection('lesson');
  };

  const handleLogout = () => {
    logout();
    setActiveSection('home');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <p className="text-purple-600 dark:text-purple-400">Загрузка...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <Header activeSection={activeSection} setActiveSection={setActiveSection} onLogout={handleLogout} userRole={userRole} />

      {userRole === 'student' && (
        <>
          {activeSection === 'home' && (
            <>
              <Hero setActiveSection={setActiveSection} />
              <FeaturesSection />
              <CoursesSection setActiveSection={setActiveSection} onOpenLesson={openLesson} />
            </>
          )}
          {activeSection === 'courses' && <CoursesSection setActiveSection={setActiveSection} onOpenLesson={openLesson} />}
          {activeSection === 'lesson' && (
            <InteractiveLessonDemo
              courseId={selectedCourseId}
              lessonId={selectedLessonId}
              setActiveSection={setActiveSection}
              onSelectLesson={setSelectedLessonId}
            />
          )}
          {activeSection === 'profile' && <UserProfile setActiveSection={setActiveSection} onOpenLesson={(courseId) => openLesson(courseId)} />}
          {activeSection === 'community' && <CommunityPage />}
        </>
      )}

      {userRole === 'teacher' && (
        <>
          {activeSection === 'dashboard' && <TeacherDashboard />}
          {activeSection === 'courses' && <TeacherCourses />}
          {activeSection === 'students' && <TeacherStudents />}
          {activeSection === 'profile' && <TeacherProfile />}
          {activeSection === 'community' && <CommunityPage />}
        </>
      )}

      {userRole === 'admin' && (
        <>
          {activeSection === 'dashboard' && <AdminDashboard />}
          {activeSection === 'users' && <AdminUsers />}
          {activeSection === 'courses' && <AdminCourses />}
          {activeSection === 'stats' && <AdminStats />}
          {activeSection === 'community' && <AdminCommunity />}
        </>
      )}

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}