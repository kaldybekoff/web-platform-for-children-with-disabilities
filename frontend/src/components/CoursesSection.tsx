import { useEffect, useState } from 'react';
import { Play, Clock, Star, Search, BookOpen, CheckCircle, Trophy } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useLanguage } from '../contexts/LanguageContext';
import * as coursesApi from '../api/courses';
import * as lessonsApi from '../api/lessons';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [lessonCounts, setLessonCounts] = useState<Record<number, number>>({});

  useEffect(() => {
    Promise.all([coursesApi.listCourses(), coursesApi.myCourses()])
      .then(async ([list, enrollments]) => {
        setCourses(list);
        setMyEnrollments(enrollments);
        const counts: Record<number, number> = {};
        await Promise.all(
          list.map(async (course) => {
            try {
              const lessons = await lessonsApi.listLessonsByCourse(course.id);
              counts[course.id] = lessons.length;
            } catch {
              counts[course.id] = 0;
            }
          })
        );
        setLessonCounts(counts);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, []);

  const enrolledIds = new Set(myEnrollments.map((e) => e.course_id));

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = levelFilter === 'all' || course.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

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

  const levelOptions = [
    { value: 'all', labelRu: 'Все', labelKz: 'Барлығы' },
    { value: 'beginner', labelRu: 'Начальный', labelKz: 'Бастауыш' },
    { value: 'intermediate', labelRu: 'Средний', labelKz: 'Орташа' },
    { value: 'advanced', labelRu: 'Продвинутый', labelKz: 'Жоғары' },
  ];

  return (
    <section className="container mx-auto px-4 py-16 bg-white/50 dark:bg-gray-800/50 rounded-3xl my-8 transition-colors duration-300">
      <div className="text-center mb-8">
        <h2 className="text-purple-700 dark:text-purple-400 mb-4">
          {t('Популярные курсы', 'Танымал курстар')}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-xl">
          {t('Выбери курс и начни обучение прямо сейчас', 'Курсты таңдап, қазір оқуды баста')}
        </p>
      </div>

      <div className="mb-8 space-y-4">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('Поиск курсов...', 'Курстарды іздеу...')}
            className="pl-10 h-11 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700"
          />
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {levelOptions.map((option) => (
            <Button
              key={option.value}
              variant={levelFilter === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLevelFilter(option.value)}
              className={`rounded-full px-4 ${
                levelFilter === option.value
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'dark:border-gray-600 dark:hover:bg-gray-700'
              }`}
            >
              {t(option.labelRu, option.labelKz)}
            </Button>
          ))}
        </div>
      </div>

      {courses.length === 0 ? (
        <p className="text-center text-gray-600 dark:text-gray-400">{t('Курсов пока нет', 'Курстар әзірше жоқ')}</p>
      ) : filteredCourses.length === 0 ? (
        <p className="text-center text-gray-600 dark:text-gray-400">{t('Курсы не найдены', 'Курстар табылмады')}</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const isEnrolled = enrolledIds.has(course.id);
            const isEnrolling = enrollingId === course.id;
            const enrollment = myEnrollments.find(e => e.course_id === course.id);
            const progress = enrollment?.progress ?? 0;
            const isCompleted = progress >= 100;
            return (
              <div
                key={course.id}
                className={`bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 border-2 ${
                  isCompleted 
                    ? 'border-yellow-400 dark:border-yellow-600' 
                    : 'border-gray-100 dark:border-gray-700'
                }`}
              >
                <div className="relative aspect-video bg-gradient-to-br from-purple-200 to-blue-200 dark:from-purple-700 dark:to-blue-700">
                  {course.image_url ? (
                    <ImageWithFallback
                      src={course.image_url}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-purple-400 dark:text-purple-300 opacity-50" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-purple-600 dark:bg-purple-700 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    <span className="text-lg">👋</span>
                    <span>{t('Жесты', 'Ымдар')}</span>
                  </div>
                  <Badge className="absolute top-3 left-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                    {levelText(course.level)}
                  </Badge>
                  {/* Completion badge overlay */}
                  {isCompleted && (
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 shadow-lg">
                        <Trophy className="w-4 h-4" />
                        <span className="font-medium">{t('Курс пройден!', 'Курс өтілді!')}</span>
                      </div>
                    </div>
                  )}
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
                      <BookOpen className="w-4 h-4" />
                      <span>
                        {lessonCounts[course.id] ?? 0} {t('уроков', 'сабақ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Play className="w-4 h-4" />
                      <span>{levelText(course.level)}</span>
                    </div>
                  </div>
                  {/* Progress bar for enrolled courses */}
                  {isEnrolled && (
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-500 dark:text-gray-400">{t('Прогресс', 'Прогресс')}</span>
                        <span className={`font-medium ${isCompleted ? 'text-green-600 dark:text-green-400' : 'text-purple-600 dark:text-purple-400'}`}>
                          {Math.round(progress)}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all"
                          style={{ 
                            width: `${progress}%`,
                            backgroundColor: isCompleted ? '#22c55e' : '#9333ea'
                          }} 
                        />
                      </div>
                    </div>
                  )}
                  {!isEnrolled && (
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-gray-800 dark:text-gray-200">—</span>
                      </div>
                    </div>
                  )}
                  {isEnrolled ? (
                    <Button 
                      className={`w-full rounded-xl shadow-md ${
                        isCompleted 
                          ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-medium' 
                          : 'bg-purple-600 hover:bg-purple-700'
                      }`} 
                      onClick={() => onOpenLesson(course.id)}
                    >
                      {isCompleted ? (
                        <>
                          <BookOpen className="w-4 h-4 mr-2" />
                          {t('Просмотреть', 'Қарау')}
                        </>
                      ) : (
                        t('Продолжить', 'Жалғастыру')
                      )}
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
