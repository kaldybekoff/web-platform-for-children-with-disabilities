import { useEffect, useState, useMemo } from 'react';
import { Award, BookOpen, Trophy, Star, Target, CheckCircle, Edit2, Save, X, ArrowLeft, GraduationCap, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Label } from './ui/label';
import { useLanguage } from '../contexts/LanguageContext';
import * as meApi from '../api/me';
import * as coursesApi from '../api/courses';
import type { UserResponse, EnrollmentWithCourseResponse, UserAchievementStats } from '../api/types';

interface PasswordValidation {
  isValid: boolean;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

function validatePassword(password: string): PasswordValidation {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;'`~]/.test(password);
  
  return {
    isValid: hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial,
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecial,
  };
}

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
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [userData, setUserData] = useState<UserResponse | null>(null);
  const [myEnrollments, setMyEnrollments] = useState<EnrollmentWithCourseResponse[]>([]);
  const [achievementStats, setAchievementStats] = useState<UserAchievementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [editedFirstName, setEditedFirstName] = useState('');
  const [editedLastName, setEditedLastName] = useState('');
  const [editedEmail, setEditedEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    Promise.all([meApi.getMe(), coursesApi.myCourses(), meApi.getMyAchievements()])
      .then(([user, enrollments, achievements]) => {
        setUserData(user);
        setEditedFirstName(user.first_name);
        setEditedLastName(user.last_name);
        setEditedEmail(user.email);
        setMyEnrollments(enrollments);
        setAchievementStats(achievements);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Ошибка'))
      .finally(() => setLoading(false));
  }, []);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const displayName = userData ? [userData.first_name, userData.last_name].filter(Boolean).join(' ') || userData.email : '';

  // OAuth-only accounts have no password yet — show a "set password" flow instead of "change password"
  const hasPassword = userData?.has_password ?? true;
  const googleConnected = userData?.google_connected ?? false;

  const passwordValidation = useMemo(() => validatePassword(newPassword), [newPassword]);

  const stats = achievementStats || {
    completed_lessons: 0,
    enrolled_courses: 0,
    completed_courses: 0,
    passed_quizzes: 0,
    perfect_quizzes: 0,
  };

  const achievements: Achievement[] = [
    {
      id: '1',
      icon: Star,
      titleRu: 'Первая звезда',
      titleKz: 'Бірінші жұлдыз',
      descriptionRu: 'Завершите первый урок',
      descriptionKz: 'Бірінші сабақты аяқтаңыз',
      unlocked: stats.completed_lessons >= 1,
      progress: Math.min(stats.completed_lessons, 1),
      maxProgress: 1,
      color: 'bg-yellow-500',
    },
    {
      id: '2',
      icon: BookOpen,
      titleRu: 'Любитель знаний',
      titleKz: 'Білім сүйер',
      descriptionRu: 'Завершите 5 уроков',
      descriptionKz: '5 сабақты аяқтаңыз',
      unlocked: stats.completed_lessons >= 5,
      progress: Math.min(stats.completed_lessons, 5),
      maxProgress: 5,
      color: 'bg-blue-500',
    },
    {
      id: '3',
      icon: Target,
      titleRu: 'Мастер уроков',
      titleKz: 'Сабақ шебері',
      descriptionRu: 'Завершите 10 уроков',
      descriptionKz: '10 сабақты аяқтаңыз',
      unlocked: stats.completed_lessons >= 10,
      progress: Math.min(stats.completed_lessons, 10),
      maxProgress: 10,
      color: 'bg-purple-500',
    },
    {
      id: '4',
      icon: Trophy,
      titleRu: 'Выпускник',
      titleKz: 'Түлек',
      descriptionRu: 'Завершите курс полностью',
      descriptionKz: 'Курсты толық аяқтаңыз',
      unlocked: stats.completed_courses >= 1,
      progress: Math.min(stats.completed_courses, 1),
      maxProgress: 1,
      color: 'bg-green-500',
    },
    {
      id: '5',
      icon: CheckCircle,
      titleRu: 'Успешный тест',
      titleKz: 'Сәтті тест',
      descriptionRu: 'Пройдите первый тест',
      descriptionKz: 'Бірінші тестті өтіңіз',
      unlocked: stats.passed_quizzes >= 1,
      progress: Math.min(stats.passed_quizzes, 1),
      maxProgress: 1,
      color: 'bg-orange-500',
    },
    {
      id: '6',
      icon: Award,
      titleRu: 'Отличник',
      titleKz: 'Үздік оқушы',
      descriptionRu: 'Получите 100% в тесте',
      descriptionKz: 'Тестте 100% алыңыз',
      unlocked: stats.perfect_quizzes >= 1,
      progress: Math.min(stats.perfect_quizzes, 1),
      maxProgress: 1,
      color: 'bg-red-500',
    },
  ];

  const handleSave = async () => {
    if (!userData) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await meApi.updateMe({
        first_name: editedFirstName,
        last_name: editedLastName,
        email: editedEmail !== userData.email ? editedEmail : undefined,
      });
      setUserData(updated);
      setIsEditing(false);
      showSuccess(t('Данные сохранены', 'Деректер сақталды'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Не удалось сохранить', 'Сақтау мүмкін болмады'));
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async () => {
    if (!newPassword || (hasPassword && !currentPassword)) return;
    if (!passwordValidation.isValid) {
      setError(t(
        'Пароль должен содержать минимум 8 символов, заглавную и строчную букву, цифру и спецсимвол',
        'Құпия сөз кемінде 8 таңба, бас және кіші әріп, сан және арнайы таңба болуы керек'
      ));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('Пароли не совпадают', 'Құпия сөздер сәйкес келмейді'));
      return;
    }
    setSavingPassword(true);
    setError(null);
    try {
      await meApi.changePassword({
        ...(hasPassword ? { current_password: currentPassword } : {}),
        new_password: newPassword,
      });
      const updated = await meApi.getMe();
      setUserData(updated);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
      showSuccess(hasPassword ? t('Пароль изменён', 'Құпия сөз өзгертілді') : t('Пароль установлен', 'Құпия сөз орнатылды'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Неверный текущий пароль', 'Ағымдағы құпия сөз қате'));
    } finally {
      setSavingPassword(false);
    }
  };

  const handleCancel = () => {
    setEditedFirstName(userData?.first_name ?? '');
    setEditedLastName(userData?.last_name ?? '');
    setEditedEmail(userData?.email ?? '');
    setIsEditing(false);
    setError(null);
  };

  const handleCancelPassword = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordForm(false);
    setError(null);
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
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400 mb-3 bg-red-50 dark:bg-red-900/30 px-3 py-2 rounded-lg">{error}</p>
              )}
              {successMsg && (
                <p className="text-sm text-green-600 dark:text-green-400 mb-3 bg-green-50 dark:bg-green-900/30 px-3 py-2 rounded-lg">{successMsg}</p>
              )}

              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-600 dark:text-gray-400">{t('Имя', 'Аты')}</Label>
                      <Input
                        value={editedFirstName}
                        onChange={(e) => setEditedFirstName(e.target.value)}
                        className="mt-1 border-2 border-purple-300 dark:border-purple-600 dark:bg-gray-700 dark:text-white rounded-xl"
                        placeholder={t('Имя', 'Аты')}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600 dark:text-gray-400">{t('Фамилия', 'Тегі')}</Label>
                      <Input
                        value={editedLastName}
                        onChange={(e) => setEditedLastName(e.target.value)}
                        className="mt-1 border-2 border-purple-300 dark:border-purple-600 dark:bg-gray-700 dark:text-white rounded-xl"
                        placeholder={t('Фамилия', 'Тегі')}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      Email
                    </Label>
                    <Input
                      type="email"
                      value={editedEmail}
                      onChange={(e) => setEditedEmail(e.target.value)}
                      className="mt-1 border-2 border-purple-300 dark:border-purple-600 dark:bg-gray-700 dark:text-white rounded-xl"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
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
              ) : showPasswordForm ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    {hasPassword ? t('Изменить пароль', 'Құпия сөзді өзгерту') : t('Задать пароль', 'Құпия сөз орнату')}
                  </h3>
                  {!hasPassword && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t(
                        'Вы вошли через Google. Задайте пароль, чтобы также входить по email.',
                        'Сіз Google арқылы кірдіңіз. Email арқылы да кіру үшін құпия сөз орнатыңыз.'
                      )}
                    </p>
                  )}
                  {hasPassword && (
                  <div>
                    <Label className="text-xs text-gray-600 dark:text-gray-400">{t('Текущий пароль', 'Ағымдағы құпия сөз')}</Label>
                    <div className="relative mt-1">
                      <Input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="border-2 border-purple-300 dark:border-purple-600 dark:bg-gray-700 dark:text-white rounded-xl pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  )}
                  <div>
                    <Label className="text-xs text-gray-600 dark:text-gray-400">{t('Новый пароль', 'Жаңа құпия сөз')}</Label>
                    <div className="relative mt-1">
                      <Input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="border-2 border-purple-300 dark:border-purple-600 dark:bg-gray-700 dark:text-white rounded-xl pr-10"
                        placeholder={t('Минимум 6 символов', 'Кемінде 6 таңба')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {newPassword && (
                      <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-1 text-xs">
                        <div className={`flex items-center gap-1 ${passwordValidation.hasMinLength ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                          {passwordValidation.hasMinLength ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          {t('Мин. 8 символов', 'Кем. 8 таңба')}
                        </div>
                        <div className={`flex items-center gap-1 ${passwordValidation.hasUppercase ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                          {passwordValidation.hasUppercase ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          {t('Заглавная (A-Z)', 'Бас әріп (A-Z)')}
                        </div>
                        <div className={`flex items-center gap-1 ${passwordValidation.hasLowercase ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                          {passwordValidation.hasLowercase ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          {t('Строчная (a-z)', 'Кіші әріп (a-z)')}
                        </div>
                        <div className={`flex items-center gap-1 ${passwordValidation.hasNumber ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                          {passwordValidation.hasNumber ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          {t('Цифра (0-9)', 'Сан (0-9)')}
                        </div>
                        <div className={`flex items-center gap-1 ${passwordValidation.hasSpecial ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                          {passwordValidation.hasSpecial ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          {t('Спецсимвол (!@#...)', 'Арнайы таңба (!@#...)')}
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600 dark:text-gray-400">{t('Подтвердите пароль', 'Құпия сөзді растаңыз')}</Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`mt-1 border-2 dark:bg-gray-700 dark:text-white rounded-xl ${
                        confirmPassword && newPassword !== confirmPassword
                          ? 'border-red-300 dark:border-red-600'
                          : 'border-purple-300 dark:border-purple-600'
                      }`}
                    />
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {t('Пароли не совпадают', 'Құпия сөздер сәйкес келмейді')}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      onClick={handleSavePassword}
                      disabled={savingPassword || !newPassword || (hasPassword && !currentPassword)}
                      className="bg-purple-600 hover:bg-purple-700 rounded-xl"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      {savingPassword
                        ? t('Сохранение...', 'Сақтау...')
                        : hasPassword ? t('Изменить пароль', 'Құпия сөзді өзгерту') : t('Задать пароль', 'Құпия сөз орнату')}
                    </Button>
                    <Button onClick={handleCancelPassword} variant="outline" className="rounded-xl dark:border-gray-600 dark:hover:bg-gray-700">
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
                      title={t('Редактировать профиль', 'Профильді өңдеу')}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    {userData?.email} • {t('Роль', 'Рөл')}: {userData?.role}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <Button
                      onClick={() => setShowPasswordForm(true)}
                      variant="outline"
                      size="sm"
                      className="rounded-xl dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      {hasPassword ? t('Изменить пароль', 'Құпия сөзді өзгерту') : t('Задать пароль', 'Құпия сөз орнату')}
                    </Button>
                    {googleConnected && (
                      <Badge variant="secondary" className="rounded-xl gap-1">
                        <CheckCircle className="w-3 h-3" />
                        {t('Вход через Google', 'Google арқылы кіру')}
                      </Badge>
                    )}
                  </div>

                  {/* Статистика */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 p-3 rounded-2xl text-center border-2 border-blue-300 dark:border-blue-700">
                      <BookOpen className="w-6 h-6 mx-auto mb-1 text-blue-600 dark:text-blue-400" />
                      <div className="text-blue-900 dark:text-blue-100">{myEnrollments.length}</div>
                      <div className="text-xs text-blue-700 dark:text-blue-300">{t('Мои курсы', 'Менің курстарым')}</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 p-3 rounded-2xl text-center border-2 border-green-300 dark:border-green-700">
                      <Star className="w-6 h-6 mx-auto mb-1 text-green-600 dark:text-green-400" />
                      <div className="text-green-900 dark:text-green-100">{stats.completed_lessons}</div>
                      <div className="text-xs text-green-700 dark:text-green-300">{t('Уроков пройдено', 'Өтілген сабақтар')}</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 p-3 rounded-2xl text-center border-2 border-purple-300 dark:border-purple-700">
                      <CheckCircle className="w-6 h-6 mx-auto mb-1 text-purple-600 dark:text-purple-400" />
                      <div className="text-purple-900 dark:text-purple-100">{stats.passed_quizzes}</div>
                      <div className="text-xs text-purple-700 dark:text-purple-300">{t('Тестов сдано', 'Тапсырылған тест')}</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800 p-3 rounded-2xl text-center border-2 border-orange-300 dark:border-orange-700">
                      <Award className="w-6 h-6 mx-auto mb-1 text-orange-600 dark:text-orange-400" />
                      <div className="text-orange-900 dark:text-orange-100">{achievements.filter(a => a.unlocked).length}</div>
                      <div className="text-xs text-orange-700 dark:text-orange-300">{t('Достижений', 'Жетістіктер')}</div>
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
              myEnrollments.map((enr) => {
                const isCompleted = enr.progress >= 100;
                return (
                  <div
                    key={enr.id}
                    className={`p-5 rounded-2xl border-2 transition-all hover:shadow-lg ${
                      isCompleted
                        ? 'bg-gradient-to-r from-amber-50 to-yellow-100 dark:from-amber-900/50 dark:to-yellow-900/40 border-amber-400 dark:border-amber-500'
                        : 'bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-600 border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500'
                    }`}
                  >
                    {/* Certificate banner for completed courses */}
                    {isCompleted && (
                      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-amber-400 dark:border-amber-500">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                          <GraduationCap className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                            {t('Курс завершен!', 'Курс аяқталды!')}
                          </p>
                          <p className="text-xs text-amber-700 dark:text-amber-400">
                            {t('Поздравляем с успешным завершением', 'Сәтті аяқтаумен құттықтаймыз')}
                          </p>
                        </div>
                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg font-medium">
                          <Trophy className="w-3 h-3 mr-1" />
                          {t('Сертификат', 'Сертификат')}
                        </Badge>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-3">
                      <h4 className={isCompleted ? 'text-amber-900 dark:text-amber-100 font-semibold' : 'text-gray-900 dark:text-gray-100'}>{enr.course_title}</h4>
                      <Badge className={isCompleted ? 'bg-green-600 text-white border-0 shadow-sm font-semibold' : 'bg-blue-500 text-white border-0'}>
                        {Math.round(enr.progress)}%
                      </Badge>
                    </div>

                    <div className="mb-3">
                      <Progress 
                        value={enr.progress} 
                        className={`h-3 rounded-full ${
                          isCompleted 
                            ? '[&>div]:bg-green-500 bg-amber-200 dark:bg-amber-800/60' 
                            : ''
                        }`} 
                      />
                    </div>

                    <div className={`flex items-center justify-between text-sm ${isCompleted ? 'text-amber-800 dark:text-amber-300' : 'text-gray-600 dark:text-gray-400'}`}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{enr.course_level}</span>
                        {isCompleted && (
                          <span className="flex items-center gap-1 text-green-700 dark:text-green-400 font-semibold">
                            <CheckCircle className="w-4 h-4" />
                            {t('Пройден', 'Өтілді')}
                          </span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        className={`rounded-xl shadow-md ${
                          isCompleted 
                            ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-medium' 
                            : 'bg-purple-500 hover:bg-purple-600'
                        }`}
                        onClick={() => {
                          onOpenLesson?.(enr.course_id);
                          setActiveSection('lesson');
                        }}
                      >
                        {isCompleted ? (
                          <>
                            <BookOpen className="w-4 h-4 mr-1.5" />
                            {t('Просмотреть', 'Қарау')}
                          </>
                        ) : (
                          t('Продолжить', 'Жалғастыру')
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}