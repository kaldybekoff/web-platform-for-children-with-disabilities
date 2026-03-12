import { useEffect, useState } from 'react';
import { UserCircle, BookOpen, Users, Edit2, Save, X, Mail, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useLanguage } from '../contexts/LanguageContext';
import * as meApi from '../api/me';
import * as teacherApi from '../api/teacher';
import type { UserResponse, TeacherStats } from '../api/types';

export function TeacherProfile() {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState<UserResponse | null>(null);
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editedFirstName, setEditedFirstName] = useState('');
  const [editedLastName, setEditedLastName] = useState('');
  const [editedPhone, setEditedPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([meApi.getMe(), teacherApi.getTeacherStats()])
      .then(([user, teacherStats]) => {
        setUserData(user);
        setStats(teacherStats);
        setEditedFirstName(user.first_name);
        setEditedLastName(user.last_name);
        setEditedPhone(user.phone || '');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Ошибка'))
      .finally(() => setLoading(false));
  }, []);

  const displayName = userData
    ? [userData.first_name, userData.last_name].filter(Boolean).join(' ') || userData.email
    : '';

  const handleSave = async () => {
    if (!userData) return;
    setSaving(true);
    try {
      const updated = await meApi.updateMe({
        first_name: editedFirstName,
        last_name: editedLastName,
        phone: editedPhone,
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
    setEditedPhone(userData?.phone ?? '');
    setIsEditing(false);
  };

  if (loading) {
    return (
      <section className="container mx-auto px-4 py-8">
        <p className="text-purple-600 dark:text-purple-400">{t('Загрузка профиля...', 'Профиль жүктелуде...')}</p>
      </section>
    );
  }

  if (error && !userData) {
    return (
      <section className="container mx-auto px-4 py-8">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </section>
    );
  }

  const roleLabel = {
    student: { ru: 'Ученик', kz: 'Оқушы' },
    teacher: { ru: 'Учитель', kz: 'Мұғалім' },
    admin: { ru: 'Администратор', kz: 'Әкімші' },
  };

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center">
          <UserCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h2 className="text-purple-700 dark:text-purple-400 text-lg">
            {t('Мой профиль', 'Менің профилім')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-xs">
            {t('Информация об учителе', 'Мұғалім туралы ақпарат')}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-2">
          <Card className="p-6 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-100 dark:border-gray-700">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <Avatar className="w-24 h-24 border-4 border-purple-400 dark:border-purple-500 shadow-lg shrink-0">
                <AvatarImage src="" />
                <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-400 text-white text-3xl">
                  {displayName.charAt(0) || userData?.email?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>

              {/* User Info */}
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-600 dark:text-gray-400">{t('Имя', 'Аты')}</label>
                        <Input
                          value={editedFirstName}
                          onChange={(e) => setEditedFirstName(e.target.value)}
                          className="mt-1 dark:bg-gray-700 dark:border-gray-600"
                          placeholder={t('Имя', 'Аты')}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 dark:text-gray-400">{t('Фамилия', 'Тегі')}</label>
                        <Input
                          value={editedLastName}
                          onChange={(e) => setEditedLastName(e.target.value)}
                          className="mt-1 dark:bg-gray-700 dark:border-gray-600"
                          placeholder={t('Фамилия', 'Тегі')}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 dark:text-gray-400">{t('Телефон', 'Телефон')}</label>
                      <Input
                        value={editedPhone}
                        onChange={(e) => setEditedPhone(e.target.value)}
                        className="mt-1 dark:bg-gray-700 dark:border-gray-600"
                        placeholder="+7 XXX XXX XX XX"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={handleSave}
                        disabled={saving}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 rounded-lg"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        {saving ? t('Сохранение...', 'Сақтау...') : t('Сохранить', 'Сақтау')}
                      </Button>
                      <Button onClick={handleCancel} variant="outline" size="sm" className="rounded-lg">
                        <X className="w-4 h-4 mr-1" />
                        {t('Отмена', 'Болдырмау')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{displayName}</h3>
                      <Button
                        onClick={() => setIsEditing(true)}
                        variant="ghost"
                        size="icon"
                        className="rounded-full hover:bg-purple-100 dark:hover:bg-purple-900 h-8 w-8"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Mail className="w-4 h-4" />
                        <span>{userData?.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Shield className="w-4 h-4" />
                        <span>{t(roleLabel[userData?.role || 'teacher']?.ru, roleLabel[userData?.role || 'teacher']?.kz)}</span>
                      </div>
                      {userData?.phone && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <span className="w-4 h-4 text-center">📞</span>
                          <span>{userData.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('Дата регистрации', 'Тіркелу күні')}: {userData?.created_at ? new Date(userData.created_at).toLocaleDateString() : '-'}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Stats Card */}
        <div>
          <Card className="p-6 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-100 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-4">
              {t('Моя статистика', 'Менің статистикам')}
            </h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{stats?.total_courses ?? 0}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{t('Курсов', 'Курс')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{stats?.total_students ?? 0}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{t('Учеников', 'Оқушы')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <span className="text-lg">📚</span>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{stats?.total_lessons ?? 0}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{t('Уроков', 'Сабақ')}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
