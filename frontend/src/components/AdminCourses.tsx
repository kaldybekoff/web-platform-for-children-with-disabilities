import { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { Card } from './ui/card';
import { useLanguage } from '../contexts/LanguageContext';
import * as coursesApi from '../api/courses';
import * as lessonsApi from '../api/lessons';
import type { CourseResponse } from '../api/types';

export function AdminCourses() {
  const { t } = useLanguage();
  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [lessonCounts, setLessonCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    coursesApi
      .listCourses()
      .then(async (list) => {
        setCourses(list);
        const lists = await Promise.all(list.map((c) => lessonsApi.listLessonsByCourse(c.id)));
        const counts: Record<number, number> = {};
        list.forEach((c, i) => {
          counts[c.id] = lists[i]?.length ?? 0;
        });
        setLessonCounts(counts);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Ошибка'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center shrink-0">
          <BookOpen className="w-5 h-5 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h2 className="text-purple-700 dark:text-purple-400 text-lg">{t('Курсы платформы', 'Платформа курстары')}</h2>
          <p className="text-gray-600 dark:text-gray-400 text-xs">{t('Все курсы платформы', 'Платформаның барлық курстары')}</p>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400 mb-2">{error}</p>}
      {loading && <p className="text-purple-600 dark:text-purple-400 text-sm">{t('Загрузка...', 'Жүктелуде...')}</p>}

      <div className="space-y-3">
        {courses.map((c) => (
          <Card key={c.id} className="p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              {c.image_url && (
                <img src={c.image_url} alt={c.title} className="w-12 h-12 rounded-lg object-cover shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <h3 className="text-gray-800 dark:text-gray-100 text-sm font-medium truncate">{c.title}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{lessonCounts[c.id] ?? 0} {t('уроков', 'сабақ')} · {c.level}</p>
                {c.description && <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5 truncate">{c.description}</p>}
              </div>
            </div>
          </Card>
        ))}
      </div>
      {!loading && courses.length === 0 && <p className="text-gray-500 dark:text-gray-400 text-sm mt-4">{t('Курсов пока нет', 'Курстар әзірше жоқ')}</p>}
    </section>
  );
}
