import { useEffect, useState } from 'react';
import { LayoutDashboard, Users, BookOpen, BarChart3, GraduationCap, UserCheck } from 'lucide-react';
import { Card } from './ui/card';
import { useLanguage } from '../contexts/LanguageContext';
import * as adminApi from '../api/admin';
import type { AdminStats } from '../api/types';

export function AdminDashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getAdminStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statItems = [
    { 
      icon: Users, 
      value: stats?.total_users ?? 0, 
      labelRu: 'Пользователей', 
      labelKz: 'Пайдаланушылар', 
      subRu: `${stats?.total_students ?? 0} учеников, ${stats?.total_teachers ?? 0} учителей`, 
      subKz: `${stats?.total_students ?? 0} оқушы, ${stats?.total_teachers ?? 0} мұғалім`, 
      color: 'bg-blue-500' 
    },
    { 
      icon: BookOpen, 
      value: stats?.total_courses ?? 0, 
      labelRu: 'Курсов', 
      labelKz: 'Курстар', 
      subRu: `${stats?.total_lessons ?? 0} уроков`, 
      subKz: `${stats?.total_lessons ?? 0} сабақ`, 
      color: 'bg-green-500' 
    },
    { 
      icon: GraduationCap, 
      value: stats?.total_enrollments ?? 0, 
      labelRu: 'Записей на курсы', 
      labelKz: 'Курстарға жазылулар', 
      subRu: `${stats?.completed_lessons ?? 0} уроков завершено`, 
      subKz: `${stats?.completed_lessons ?? 0} сабақ аяқталды`, 
      color: 'bg-purple-500' 
    },
  ];

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center">
          <LayoutDashboard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h2 className="text-purple-700 dark:text-purple-400 text-lg">{t('Панель администратора', 'Администратор панелі')}</h2>
          <p className="text-gray-600 dark:text-gray-400 text-xs">{t('Обзор платформы', 'Платформаға шолу')}</p>
        </div>
      </div>

      {loading ? (
        <p className="text-purple-600 dark:text-purple-400 text-sm">{t('Загрузка...', 'Жүктелуде...')}</p>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
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
