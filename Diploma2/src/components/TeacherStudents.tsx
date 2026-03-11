import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { Card } from './ui/card';
import { useLanguage } from '../contexts/LanguageContext';
import * as teacherApi from '../api/teacher';
import type { StudentWithProgress } from '../api/types';

export function TeacherStudents() {
  const { t } = useLanguage();
  const [students, setStudents] = useState<StudentWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    teacherApi.getTeacherStudents()
      .then((data) => {
        setStudents(data.students);
        setTotal(data.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return t('Сегодня', 'Бүгін');
    if (diffDays === 1) return t('Вчера', 'Кеше');
    if (diffDays < 7) return t(`${diffDays} дн. назад`, `${diffDays} күн бұрын`);
    return date.toLocaleDateString();
  };

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
          <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h2 className="text-purple-700 dark:text-purple-400 text-lg">{t('Ученики', 'Оқушылар')}</h2>
          <p className="text-gray-600 dark:text-gray-400 text-xs">{t('Прогресс учеников по курсам', 'Оқушылардың курстар бойынша прогресі')}</p>
        </div>
      </div>

      {loading ? (
        <p className="text-purple-600 dark:text-purple-400 text-sm">{t('Загрузка...', 'Жүктелуде...')}</p>
      ) : students.length === 0 ? (
        <Card className="p-6 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-100 dark:border-gray-700 text-center">
          <p className="text-gray-600 dark:text-gray-400">{t('Пока нет учеников на ваших курсах', 'Сіздің курстарыңызда әлі оқушылар жоқ')}</p>
        </Card>
      ) : (
        <Card className="p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400 text-xs font-medium">{t('Ученик', 'Оқушы')}</th>
                  <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400 text-xs font-medium">{t('Курс', 'Курс')}</th>
                  <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400 text-xs font-medium">{t('Прогресс', 'Прогресс')}</th>
                  <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400 text-xs font-medium">{t('Дата записи', 'Жазылған күні')}</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={`${s.id}-${s.course_id}`} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-2 px-3">
                      <div>
                        <p className="text-gray-800 dark:text-gray-100">{s.first_name} {s.last_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{s.email}</p>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-gray-600 dark:text-gray-400">{s.course_title}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full max-w-[80px]">
                          <div className="h-1.5 bg-purple-500 rounded-full" style={{ width: `${s.progress}%` }} />
                        </div>
                        <span className="text-gray-800 dark:text-gray-100 text-xs">{s.progress.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-xs text-gray-500 dark:text-gray-400">{formatDate(s.enrolled_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
            {t(`Всего: ${total} записей`, `Барлығы: ${total} жазба`)}
          </p>
        </Card>
      )}
    </section>
  );
}
