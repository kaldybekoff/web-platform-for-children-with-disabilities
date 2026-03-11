import { useEffect, useState } from 'react';
import { LayoutDashboard, BookOpen, Users, TrendingUp } from 'lucide-react';
import { Card } from './ui/card';
import { useLanguage } from '../contexts/LanguageContext';
import * as teacherApi from '../api/teacher';
import type { TeacherStats } from '../api/types';

export function TeacherDashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    teacherApi.getTeacherStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statItems = [
    { 
      icon: BookOpen, 
      value: stats?.total_courses ?? 0, 
      labelRu: 'Мои курсы', 
      labelKz: 'Менің курстарым', 
      subRu: `${stats?.total_lessons ?? 0} уроков`, 
      subKz: `${stats?.total_lessons ?? 0} сабақ`, 
      color: 'bg-blue-500' 
    },
    { 
      icon: Users, 
      value: stats?.total_students ?? 0, 
      labelRu: 'Учеников', 
      labelKz: 'Оқушылар', 
      subRu: 'записаны на курсы', 
      subKz: 'курстарға жазылған', 
      color: 'bg-green-500' 
    },
    { 
      icon: TrendingUp, 
      value: `${stats?.average_progress?.toFixed(0) ?? 0}%`, 
      labelRu: 'Средний прогресс', 
      labelKz: 'Орташа үлгерім', 
      subRu: 'по всем курсам', 
      subKz: 'барлық курстар бойынша', 
      color: 'bg-purple-500' 
    },
  ];

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center">
          <LayoutDashboard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h2 className="text-purple-700 dark:text-purple-400 text-lg">
            {t('Панель учителя', 'Мұғалім панелі')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-xs">
            {t('Обзор ваших курсов и учеников', 'Курстарыңыз бен оқушыларға шолу')}
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-purple-600 dark:text-purple-400 text-sm">{t('Загрузка...', 'Жүктелуде...')}</p>
      ) : (
        <div className="grid md:grid-cols-3 gap-4 mb-5">
          {statItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <Card key={i} className="p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 ${item.color} rounded-lg flex items-center justify-center shrink-0`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 leading-tight">{item.value}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{t(item.labelRu, item.labelKz)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">{t(item.subRu, item.subKz)}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
