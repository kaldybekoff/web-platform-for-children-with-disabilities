import { useEffect, useState } from 'react';
import { Play, Clock, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useLanguage } from '../contexts/LanguageContext';
import * as coursesApi from '../api/courses';
import type { CourseResponse, EnrollmentWithCourseResponse } from '../api/types';

interface CoursesSectionProps {
  setActiveSection: (section: string) => void;
  onOpenLesson: (courseId: number) => void;
}

const levelLabels: Record<string, { ru: string; kz: string }> = {
  beginner: { ru: 'Начальный', kz: 'Бастауыш' },
  intermediate: { ru: 'Средний', kz: 'Орташа' },
  advanced: { ru: 'Продвинутый', kz: 'Жоғары' },
};

export function CoursesSection({ setActiveSection, onOpenLesson }: CoursesSectionProps) {
  const { t } = useLanguage();
  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [myEnrollments, setMyEnrollments] = useState<EnrollmentWithCourseResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrollingId, setEnrollingId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([coursesApi.listCourses(), coursesApi.myCourses()])
      .then(([list, enrollments]) => {
        setCourses(list);
        setMyEnrollments(enrollments);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, []);

  const enrolledIds = new Set(myEnrollments.map((e) => e.course_id));

  const handleEnroll = async (courseId: number) => {
    setEnrollingId(courseId);
    try {
      await coursesApi.enrollInCourse(courseId);
      const enrollments = await coursesApi.myCourses();
      setMyEnrollments(enrollments);
    } catch {
      setError(t('Не удалось записаться на курс', 'Курсқа жазылу мүмкін болмады'));
    } finally {
      setEnrollingId(null);
    }
  };

  const levelText = (level: string) => {
    const labels = levelLabels[level] || { ru: level, kz: level };
    return t(labels.ru, labels.kz);
  };

  if (loading) {
    return (
      <section className="container mx-auto px-4 py-16">
        <p className="text-center text-purple-600 dark:text-purple-400">{t('Загрузка курсов...', 'Курстар жүктелуде...')}</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="container mx-auto px-4 py-16">
        <p className="text-center text-red-600 dark:text-red-400">{error}</p>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 py-16 bg-white/50 dark:bg-gray-800/50 rounded-3xl my-8 transition-colors duration-300">
      <div className="text-center mb-12">
        <h2 className="text-purple-700 dark:text-purple-400 mb-4">
          {t('Популярные курсы', 'Танымал курстар')}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-xl">
          {t('Выбери курс и начни обучение прямо сейчас', 'Курсты таңдап, қазір оқуды баста')}
        </p>
      </div>

      {courses.length === 0 ? (
        <p className="text-center text-gray-600 dark:text-gray-400">{t('Курсов пока нет', 'Курстар әзірше жоқ')}</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const isEnrolled = enrolledIds.has(course.id);
            const isEnrolling = enrollingId === course.id;
            return (
              <div
                key={course.id}
                className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 border-2 border-gray-100 dark:border-gray-700"
              >
                <div className="relative aspect-video bg-gradient-to-br from-purple-200 to-blue-200 dark:from-purple-700 dark:to-blue-700">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600"
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-purple-600 dark:bg-purple-700 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    <span className="text-lg">👋</span>
                    <span>{t('Жесты', 'Ымдар')}</span>
                  </div>
                  <Badge className="absolute top-3 left-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                    {levelText(course.level)}
                  </Badge>
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <button
                      className="w-16 h-16 bg-white dark:bg-gray-200 rounded-full flex items-center justify-center"
                      onClick={() => onOpenLesson(course.id)}
                    >
                      <Play className="w-8 h-8 text-purple-600 ml-1" fill="currentColor" />
                    </button>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <h3 className="text-gray-800 dark:text-gray-100 mb-1">{course.title}</h3>
                  {course.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{course.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Play className="w-4 h-4" />
                      <span>{course.level}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-gray-800 dark:text-gray-200">—</span>
                    </div>
                  </div>
                  {isEnrolled ? (
                    <Button className="w-full bg-purple-600 hover:bg-purple-700 rounded-xl" onClick={() => onOpenLesson(course.id)}>
                      {t('Начать курс', 'Курсты бастау')}
                    </Button>
                  ) : (
                    <Button
                      className="w-full bg-purple-600 hover:bg-purple-700 rounded-xl"
                      disabled={isEnrolling}
                      onClick={() => handleEnroll(course.id)}
                    >
                      {isEnrolling ? t('Запись...', 'Жазылу...') : t('Записаться', 'Жазылу')}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
