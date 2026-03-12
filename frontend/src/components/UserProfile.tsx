import { useEffect, useState } from 'react';
import { Award, BookOpen, Trophy, Star, Medal, Target, Clock, Edit2, Save, X, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useLanguage } from '../contexts/LanguageContext';
import * as meApi from '../api/me';
import * as coursesApi from '../api/courses';
import type { UserResponse, EnrollmentWithCourseResponse } from '../api/types';

interface Achievement {
  id: string;
  icon: any;
  titleRu: string;
  titleKz: string;
  descriptionRu: string;
  descriptionKz: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  color: string;
}

interface UserProfileProps {
  setActiveSection: (section: string) => void;
  onOpenLesson?: (courseId: number) => void;
}

export function UserProfile({ setActiveSection, onOpenLesson }: UserProfileProps) {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState<UserResponse | null>(null);
  const [myEnrollments, setMyEnrollments] = useState<EnrollmentWithCourseResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editedFirstName, setEditedFirstName] = useState('');
  const [editedLastName, setEditedLastName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([meApi.getMe(), coursesApi.myCourses()])
      .then(([user, enrollments]) => {
        setUserData(user);
        setEditedFirstName(user.first_name);
        setEditedLastName(user.last_name);
        setMyEnrollments(enrollments);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Ошибка'))
      .finally(() => setLoading(false));
  }, []);

  const displayName = userData ? [userData.first_name, userData.last_name].filter(Boolean).join(' ') || userData.email : '';

  const achievements: Achievement[] = [
    {
      id: '1',
      icon: Star,
      titleRu: 'Первая звезда',
      titleKz: 'Бірінші жұлдыз',
      descriptionRu: 'Завершите первый урок',
      descriptionKz: 'Бірінші сабақты аяқтаңыз',
      unlocked: true,
      progress: 1,
      maxProgress: 1,
      color: 'bg-yellow-500',
    },
    {
      id: '2',
      icon: Trophy,
      titleRu: 'Чемпион недели',
      titleKz: 'Апта чемпионы',
      descriptionRu: 'Учитесь 5 дней подряд',
      descriptionKz: '5 күн қатарынан оқыңыз',
      unlocked: true,
      progress: 5,
      maxProgress: 5,
      color: 'bg-purple-500',
    },
    {
      id: '3',
      icon: Medal,
      titleRu: 'Знаток жестов',
      titleKz: 'Ым тілін білгір',
      descriptionRu: 'Выучите 50 жестов',
      descriptionKz: '50 им үйреніңіз',
      unlocked: false,
      progress: 32,
      maxProgress: 50,
      color: 'bg-blue-500',
    },
    {
      id: '4',
      icon: BookOpen,
      titleRu: 'Любитель знаний',
      titleKz: 'Білім сүйер',
      descriptionRu: 'Завершите 5 курсов',
      descriptionKz: '5 курсты аяқтаңыз',
      unlocked: false,
      progress: 3,
      maxProgress: 5,
      color: 'bg-green-500',
    },
    {
      id: '5',
      icon: Target,
      titleRu: 'Мастер',
      titleKz: 'Шебер',
      descriptionRu: 'Наберите 2000 баллов',
      descriptionKz: '2000 ұпай жинаңыз',
      unlocked: false,
      progress: 1850,
      maxProgress: 2000,
      color: 'bg-red-500',
    },
    {
      id: '6',
      icon: Award,
      titleRu: 'Отличник',
      titleKz: 'Үздік оқушы',
      descriptionRu: 'Получите 100% в 3 уроках',
      descriptionKz: '3 сабақта 100% алыңыз',
      unlocked: true,
      progress: 3,
      maxProgress: 3,
      color: 'bg-orange-500',
    },
  ];

  const handleSave = async () => {
    if (!userData) return;
    setSaving(true);
    try {
      const updated = await meApi.updateMe({
        first_name: editedFirstName,
        last_name: editedLastName,
      });
      setUserData(updated);
      setIsEditing(false);
    } catch {
      setError(t('Не удалось сохранить', 'Сақтау мүмкін болмады'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedFirstName(userData?.first_name ?? '');
    setEditedLastName(userData?.last_name ?? '');
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center py-8">
        <p className="text-purple-600 dark:text-purple-400">{t('Загрузка профиля...', 'Профиль жүктелуде...')}</p>
      </div>
    );
  }

  if (error && !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center py-8">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  const levelProgress = 50;
  const pointsForNextLevel = 1000;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-8 transition-colors duration-300">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Back button */}
        <button
          onClick={() => setActiveSection('home')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">{t('На главную', 'Басты бетке')}</span>
        </button>

        {/* Профиль пользователя */}
        <Card className="p-6 md:p-8 bg-white dark:bg-gray-800 shadow-xl border-4 border-purple-300 dark:border-purple-600 rounded-3xl mb-8 transition-colors duration-300">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            {/* Аватар */}
            <div className="relative">
              <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-purple-400 dark:border-purple-500 shadow-lg">
                <AvatarImage src="" />
                <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-400 text-white text-3xl md:text-4xl">
                  {displayName.charAt(0) || userData?.email?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Информация о пользователе */}
            <div className="flex-1 w-full">
              {isEditing ? (
                <div className="space-y-3">
                  <Input
                    value={editedFirstName}
                    onChange={(e) => setEditedFirstName(e.target.value)}
                    className="border-2 border-purple-300 dark:border-purple-600 dark:bg-gray-700 dark:text-white rounded-xl text-lg"
                    placeholder={t('Имя', 'Аты')}
                  />
                  <Input
                    value={editedLastName}
                    onChange={(e) => setEditedLastName(e.target.value)}
                    className="border-2 border-purple-300 dark:border-purple-600 dark:bg-gray-700 dark:text-white rounded-xl text-lg"
                    placeholder={t('Фамилия', 'Тегі')}
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={saving} className="bg-green-500 hover:bg-green-600 rounded-xl">
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? t('Сохранение...', 'Сақтау...') : t('Сохранить', 'Сақтау')}
                    </Button>
                    <Button onClick={handleCancel} variant="outline" className="rounded-xl dark:border-gray-600 dark:hover:bg-gray-700">
                      <X className="w-4 h-4 mr-2" />
                      {t('Отмена', 'Болдырмау')}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-purple-600 dark:text-purple-400">{displayName}</h2>
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="ghost"
                      size="icon"
                      className="rounded-full hover:bg-purple-100 dark:hover:bg-purple-900"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {userData?.email} • {t('Роль', 'Рөл')}: {userData?.role}
                  </p>

                  {/* Статистика */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 p-3 rounded-2xl text-center border-2 border-blue-300 dark:border-blue-700">
                      <BookOpen className="w-6 h-6 mx-auto mb-1 text-blue-600 dark:text-blue-400" />
                      <div className="text-blue-900 dark:text-blue-100">{myEnrollments.length}</div>
                      <div className="text-xs text-blue-700 dark:text-blue-300">{t('Мои курсы', 'Менің курстарым')}</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Достижения */}
        <Card className="p-6 md:p-8 bg-white dark:bg-gray-800 shadow-xl border-4 border-blue-300 dark:border-blue-600 rounded-3xl mb-8 transition-colors duration-300">
          <div className="flex items-center gap-3 mb-6">
            <Award className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <h3 className="text-blue-600 dark:text-blue-400">{t('Достижения', 'Жетістіктер')}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => {
              const Icon = achievement.icon;
              return (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-2xl border-3 transition-all ${achievement.unlocked
                    ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30 border-yellow-400 dark:border-yellow-600 shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 opacity-60'
                    }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-12 h-12 ${achievement.unlocked ? achievement.color : 'bg-gray-400 dark:bg-gray-600'} rounded-xl flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className={achievement.unlocked ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}>
                        {t(achievement.titleRu, achievement.titleKz)}
                      </h4>
                      <p className={`text-sm ${achievement.unlocked ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                        {t(achievement.descriptionRu, achievement.descriptionKz)}
                      </p>
                    </div>
                    {achievement.unlocked && (
                      <Badge className="bg-green-500 text-white border-0">
                        ✓
                      </Badge>
                    )}
                  </div>

                  {!achievement.unlocked && (
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <span>{t('Прогресс', 'Прогресс')}</span>
                        <span>{achievement.progress}/{achievement.maxProgress}</span>
                      </div>
                      <Progress value={(achievement.progress / achievement.maxProgress) * 100} className="h-2" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Курсы в процессе */}
        <Card className="p-6 md:p-8 bg-white dark:bg-gray-800 shadow-xl border-4 border-green-300 dark:border-green-600 rounded-3xl transition-colors duration-300">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="w-8 h-8 text-green-600 dark:text-green-400" />
            <h3 className="text-green-600 dark:text-green-400">{t('Мои курсы', 'Менің курстарым')}</h3>
          </div>

          <div className="space-y-4">
            {myEnrollments.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">{t('Вы ещё не записаны на курсы', 'Сіз әзірше курстарға жазылмағансыз')}</p>
            ) : (
              myEnrollments.map((enr) => (
                <div
                  key={enr.id}
                  className="p-5 bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-600 rounded-2xl border-2 border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500 transition-all hover:shadow-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-gray-900 dark:text-gray-100">{enr.course_title}</h4>
                    <Badge className="bg-green-500 text-white border-0">
                      {Math.round(enr.progress * 100)}%
                    </Badge>
                  </div>

                  <div className="mb-3">
                    <Progress value={enr.progress * 100} className="h-3 rounded-full" />
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>{enr.course_level}</span>
                    <Button
                      size="sm"
                      className="bg-purple-500 hover:bg-purple-600 rounded-xl"
                      onClick={() => {
                        onOpenLesson?.(enr.course_id);
                        setActiveSection('lesson');
                      }}
                    >
                      {t('Продолжить', 'Жалғастыру')}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}