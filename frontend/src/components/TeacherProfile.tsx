import { useEffect, useState, useMemo } from 'react';
import { UserCircle, BookOpen, Users, Edit2, Save, X, Mail, Shield, ArrowLeft, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useLanguage } from '../contexts/LanguageContext';
import * as meApi from '../api/me';
import * as teacherApi from '../api/teacher';
import type { UserResponse, TeacherStats } from '../api/types';

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

interface TeacherProfileProps {
  setActiveSection?: (section: string) => void;
}

export function TeacherProfile({ setActiveSection }: TeacherProfileProps) {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [userData, setUserData] = useState<UserResponse | null>(null);
  const [stats, setStats] = useState<TeacherStats | null>(null);
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
    Promise.all([meApi.getMe(), teacherApi.getTeacherStats()])
      .then(([user, teacherStats]) => {
        setUserData(user);
        setStats(teacherStats);
        setEditedFirstName(user.first_name);
        setEditedLastName(user.last_name);
        setEditedEmail(user.email);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Ошибка'))
      .finally(() => setLoading(false));
  }, []);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const displayName = userData
    ? [userData.first_name, userData.last_name].filter(Boolean).join(' ') || userData.email
    : '';

  const passwordValidation = useMemo(() => validatePassword(newPassword), [newPassword]);

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
    if (!currentPassword || !newPassword) return;
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
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
      showSuccess(t('Пароль изменён', 'Құпия сөз өзгертілді'));
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
      {/* Back button */}
      <button
        onClick={() => setActiveSection?.('dashboard')}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">{t('К панели', 'Панельге')}</span>
      </button>

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
                          className="mt-1 dark:bg-gray-700 dark:border-gray-600"
                          placeholder={t('Имя', 'Аты')}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600 dark:text-gray-400">{t('Фамилия', 'Тегі')}</Label>
                        <Input
                          value={editedLastName}
                          onChange={(e) => setEditedLastName(e.target.value)}
                          className="mt-1 dark:bg-gray-700 dark:border-gray-600"
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
                        className="mt-1 dark:bg-gray-700 dark:border-gray-600"
                        placeholder="email@example.com"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        onClick={handleSave}
                        disabled={saving}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 rounded-lg"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        {saving ? t('Сохранение...', 'Сақтау...') : t('Сохранить', 'Сақтау')}
                      </Button>
                      <Button onClick={handleCancel} variant="outline" size="sm" className="rounded-lg dark:border-gray-600">
                        <X className="w-4 h-4 mr-1" />
                        {t('Отмена', 'Болдырмау')}
                      </Button>
                    </div>
                  </div>
                ) : showPasswordForm ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 flex items-center gap-2">
                      <Lock className="w-5 h-5" />
                      {t('Изменить пароль', 'Құпия сөзді өзгерту')}
                    </h3>
                    <div>
                      <Label className="text-xs text-gray-600 dark:text-gray-400">{t('Текущий пароль', 'Ағымдағы құпия сөз')}</Label>
                      <div className="relative mt-1">
                        <Input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="dark:bg-gray-700 dark:border-gray-600 pr-10"
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
                    <div>
                      <Label className="text-xs text-gray-600 dark:text-gray-400">{t('Новый пароль', 'Жаңа құпия сөз')}</Label>
                      <div className="relative mt-1">
                        <Input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="dark:bg-gray-700 dark:border-gray-600 pr-10"
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
                        className={`mt-1 dark:bg-gray-700 ${
                          confirmPassword && newPassword !== confirmPassword
                            ? 'border-red-300 dark:border-red-600'
                            : 'dark:border-gray-600'
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
                        disabled={savingPassword || !currentPassword || !newPassword} 
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700 rounded-lg"
                      >
                        <Lock className="w-4 h-4 mr-1" />
                        {savingPassword ? t('Сохранение...', 'Сақтау...') : t('Изменить', 'Өзгерту')}
                      </Button>
                      <Button onClick={handleCancelPassword} variant="outline" size="sm" className="rounded-lg dark:border-gray-600">
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
                        title={t('Редактировать профиль', 'Профильді өңдеу')}
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
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <Button
                        onClick={() => setShowPasswordForm(true)}
                        variant="outline"
                        size="sm"
                        className="rounded-lg dark:border-gray-600 dark:hover:bg-gray-700 mb-2"
                      >
                        <Lock className="w-4 h-4 mr-1" />
                        {t('Изменить пароль', 'Құпия сөзді өзгерту')}
                      </Button>
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
