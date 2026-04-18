import { useState, useMemo, useEffect } from 'react';
import { Mail, Lock, User, Eye, EyeOff, GraduationCap, School, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { resendVerification, forgotPassword, resetPassword } from '../api/auth';
import { getApiUrl } from '../api/client';
import type { UserRole } from '../api/types';

export type { UserRole };

type AuthView = 'login' | 'register' | 'check-email' | 'reset' | 'new-password';
type Banner = 'verified' | 'verified-expired' | 'verified-error' | 'reset-success' | 'google-error' | null;
type RegisterRole = 'student' | 'teacher';

interface PasswordValidation {
  isValid: boolean;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

function validatePassword(password: string): PasswordValidation {
  const hasMinLength = password.length >= 6;
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

export function AuthPage() {
  const { t } = useLanguage();
  const { login, register, loginWithToken } = useAuth();
  const [currentView, setCurrentView] = useState<AuthView>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [registerRole, setRegisterRole] = useState<RegisterRole>('student');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [resetToken, setResetToken] = useState('');
  const [banner, setBanner] = useState<Banner>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const passwordValidation = useMemo(() => validatePassword(formData.password), [formData.password]);
  const newPasswordValidation = useMemo(() => validatePassword(formData.newPassword), [formData.newPassword]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const v = params.get('verified');
    if (v === '1') setBanner('verified');
    else if (v === 'expired') setBanner('verified-expired');
    else if (v === 'error') setBanner('verified-error');

    const authToken = params.get('auth_token');
    if (authToken) loginWithToken(authToken);

    const rt = params.get('reset_token');
    if (rt) { setResetToken(rt); setCurrentView('new-password'); }

    const ae = params.get('auth_error');
    if (ae) setBanner('google-error');

    if (v || authToken || rt || ae) window.history.replaceState({}, '', window.location.pathname);
  }, [loginWithToken]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (currentView === 'register') {
      if (!passwordValidation.isValid) {
        setError(t(
          'Пароль должен содержать минимум 6 символов, заглавную и строчную букву, цифру и спецсимвол',
          'Құпия сөз кемінде 6 таңба, бас және кіші әріп, сан және арнайы таңба болуы керек'
        ));
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError(t('Пароли не совпадают', 'Құпия сөздер сәйкес келмейді'));
        return;
      }
      setSubmitting(true);
      try {
        await register({ email: formData.email, password: formData.password, name: formData.name, role: registerRole });
        setPendingEmail(formData.email);
        setCurrentView('check-email');
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : t('Ошибка регистрации', 'Тіркелу қатесі'));
      } finally { setSubmitting(false); }
      return;
    }

    if (currentView === 'reset') {
      setSubmitting(true);
      try {
        await forgotPassword(formData.email);
        setPendingEmail(formData.email);
        setCurrentView('check-email');
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : t('Ошибка', 'Қате'));
      } finally { setSubmitting(false); }
      return;
    }

    if (currentView === 'new-password') {
      if (!newPasswordValidation.isValid) {
        setError(t(
          'Пароль должен содержать минимум 6 символов, заглавную и строчную букву, цифру и спецсимвол',
          'Құпия сөз кемінде 6 таңба, бас және кіші әріп, сан және арнайы таңба болуы керек'
        ));
        return;
      }
      if (formData.newPassword !== formData.confirmNewPassword) {
        setError(t('Пароли не совпадают', 'Құпия сөздер сәйкес келмейді'));
        return;
      }
      setSubmitting(true);
      try {
        await resetPassword(resetToken, formData.newPassword);
        setBanner('reset-success');
        setCurrentView('login');
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : t('Ошибка', 'Қате'));
      } finally { setSubmitting(false); }
      return;
    }

    setSubmitting(true);
    try {
      await login(formData.email, formData.password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('Неверный email или пароль', 'Email немесе құпия сөз қате'));
    } finally { setSubmitting(false); }
  };

  const handleResend = async () => {
    if (resendStatus !== 'idle') return;
    setResendStatus('sending');
    try {
      await resendVerification(pendingEmail);
      setResendStatus('sent');
    } catch {
      setResendStatus('idle');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-100 to-pink-100 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-md">
        {/* Логотип */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-3xl mb-4 shadow-2xl">
            <span className="text-4xl">👋</span>
          </div>
          <h1 className="text-purple-700 dark:text-purple-300 mb-2">
            {t('QazEdu Special', 'QazEdu Special')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('Платформа дистанционного обучение  для слабослышащих детей', 'Есту мүмкіндігі шектеулі балаларға қашықтықтан оқыту платформасы')}
          </p>
        </div>

        {/* Status banner */}
        {banner && (
          <div className={`mb-4 p-4 rounded-xl text-sm font-medium flex items-start gap-3 ${
            banner === 'verified' || banner === 'reset-success'
              ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700'
              : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700'
          }`}>
            {(banner === 'verified' || banner === 'reset-success')
              ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
              : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
            <span>
              {banner === 'verified' && t('Email подтверждён! Теперь вы можете войти.', 'Email расталды! Енді кіре аласыз.')}
              {banner === 'verified-expired' && t('Ссылка устарела. Запросите новую ниже.', 'Сілтеме мерзімі өтті. Жаңасын сұраңыз.')}
              {banner === 'verified-error' && t('Неверная ссылка подтверждения.', 'Растау сілтемесі жарамсыз.')}
              {banner === 'reset-success' && t('Пароль успешно изменён. Войдите с новым паролем.', 'Құпия сөз сәтті өзгертілді. Жаңа құпия сөзбен кіріңіз.')}
              {banner === 'google-error' && t('Ошибка входа через Google. Попробуйте снова.', 'Google арқылы кіру қатесі. Қайталап көріңіз.')}
            </span>
          </div>
        )}

        <Card className="p-8 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg shadow-2xl border-2 border-purple-200 dark:border-purple-700">
          {/* Вход */}
          {currentView === 'login' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-gray-900 dark:text-gray-100 mb-2">
                  {t('Добро пожаловать!', 'Қош келдіңіз!')}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {t('Войдите в свой аккаунт', 'Аккаунтқа кіріңіз')}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                    {t('Email', 'Email')}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="pl-10 h-12 rounded-xl border-2 dark:bg-gray-700 dark:border-gray-600"
                      placeholder={t('example@mail.com', 'example@mail.com')}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
                    {t('Пароль', 'Құпия сөз')}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="pl-10 pr-10 h-12 rounded-xl border-2 dark:bg-gray-700 dark:border-gray-600"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => { setCurrentView('reset'); setError(null); }}
                    className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    {t('Забыли пароль?', 'Құпия сөзді ұмыттыңыз ба?')}
                  </button>
                </div>

                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                )}

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl text-lg shadow-lg"
                >
                  {submitting ? t('Вход...', 'Кіру...') : t('Войти', 'Кіру')}
                </Button>
              </form>

              {/* Google */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    {t('или', 'немесе')}
                  </span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 rounded-xl border-2 dark:border-gray-600"
                onClick={() => { window.location.href = getApiUrl('/auth/google'); }}
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {t('Войти через Google', 'Google арқылы кіру')}
              </Button>

              <div className="text-center mt-6">
                <span className="text-gray-600 dark:text-gray-400 text-sm">
                  {t('Нет аккаунта?', 'Аккаунт жоқ па?')}{' '}
                </span>
                <button
                  onClick={() => setCurrentView('register')}
                  className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                >
                  {t('Зарегистрироваться', 'Тіркелу')}
                </button>
              </div>
            </div>
          )}

          {/* Регистрация */}
          {currentView === 'register' && (
            <div className="space-y-6">
              <button
                onClick={() => setCurrentView('login')}
                className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('Назад', 'Артқа')}
              </button>

              <div className="text-center mb-6">
                <h2 className="text-gray-900 dark:text-gray-100 mb-2">
                  {t('Создать аккаунт', 'Аккаунт жасау')}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {t('Заполните данные для регистрации', 'Тіркелу үшін деректерді толтырыңыз')}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">
                    {t('Полное имя', 'Толық аты')}
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="pl-10 h-12 rounded-xl border-2 dark:bg-gray-700 dark:border-gray-600"
                      placeholder={t('Иван Иванов', 'Иван Иванов')}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-email" className="text-gray-700 dark:text-gray-300">
                    {t('Email', 'Email')}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="reg-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="pl-10 h-12 rounded-xl border-2 dark:bg-gray-700 dark:border-gray-600"
                      placeholder="example@mail.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-password" className="text-gray-700 dark:text-gray-300">
                    {t('Пароль', 'Құпия сөз')}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="pl-10 pr-10 h-12 rounded-xl border-2 dark:bg-gray-700 dark:border-gray-600"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {/* Password requirements indicator */}
                  {formData.password && (
                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-1">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                        {t('Требования к паролю:', 'Құпия сөз талаптары:')}
                      </p>
                      <div className="grid grid-cols-1 gap-1 text-xs">
                        <div className={`flex items-center gap-1.5 ${passwordValidation.hasMinLength ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          {passwordValidation.hasMinLength ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          {t('Минимум 6 символов', 'Кемінде 6 таңба')}
                        </div>
                        <div className={`flex items-center gap-1.5 ${passwordValidation.hasUppercase ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          {passwordValidation.hasUppercase ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          {t('Заглавная буква (A-Z)', 'Бас әріп (A-Z)')}
                        </div>
                        <div className={`flex items-center gap-1.5 ${passwordValidation.hasLowercase ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          {passwordValidation.hasLowercase ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          {t('Строчная буква (a-z)', 'Кіші әріп (a-z)')}
                        </div>
                        <div className={`flex items-center gap-1.5 ${passwordValidation.hasNumber ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          {passwordValidation.hasNumber ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          {t('Цифра (0-9)', 'Сан (0-9)')}
                        </div>
                        <div className={`flex items-center gap-1.5 ${passwordValidation.hasSpecial ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          {passwordValidation.hasSpecial ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          {t('Спецсимвол (!@#$%...)', 'Арнайы таңба (!@#$%...)')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-gray-700 dark:text-gray-300">
                    {t('Подтвердите пароль', 'Құпия сөзді растаңыз')}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className={`pl-10 h-12 rounded-xl border-2 dark:bg-gray-700 dark:border-gray-600 ${
                        formData.confirmPassword && formData.password !== formData.confirmPassword
                          ? 'border-red-300 dark:border-red-600'
                          : ''
                      }`}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {t('Пароли не совпадают', 'Құпия сөздер сәйкес келмейді')}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300">
                    {t('Я регистрируюсь как', 'Мен тіркелемін')}
                  </Label>
                  <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRegisterRole('student')}
                      className={`flex items-center justify-center gap-2 py-3 px-3 sm:px-4 rounded-xl border-2 transition-all ${
                        registerRole === 'student'
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                          : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                    >
                      <GraduationCap className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium text-sm sm:text-base">{t('Ученик', 'Оқушы')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegisterRole('teacher')}
                      className={`flex items-center justify-center gap-2 py-3 px-3 sm:px-4 rounded-xl border-2 transition-all ${
                        registerRole === 'teacher'
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                          : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                    >
                      <School className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium text-sm sm:text-base">{t('Учитель', 'Мұғалім')}</span>
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                )}

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl text-lg shadow-lg"
                >
                  {submitting ? t('Регистрация...', 'Тіркелу...') : t('Зарегистрироваться', 'Тіркелу')}
                </Button>
              </form>

              <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
                {t(
                  'Регистрируясь, вы соглашаетесь с условиями использования и политикой конфиденциальности',
                  'Тіркелу арқылы сіз пайдалану шарттарымен және құпиялық саясатымен келісесіз'
                )}
              </div>
            </div>
          )}

          {/* Забыли пароль */}
          {currentView === 'reset' && (
            <div className="space-y-6">
              <button onClick={() => setCurrentView('login')}
                className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-2">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('Назад', 'Артқа')}
              </button>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-purple-100 dark:bg-purple-900/50 rounded-full mb-3">
                  <Mail className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-gray-900 dark:text-gray-100 mb-1">{t('Сброс пароля', 'Құпия сөзді қалпына келтіру')}</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {t('Введите email — мы отправим ссылку для сброса.', 'Email енгізіңіз — сілтеме жібереміз.')}
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300">{t('Email', 'Email')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input type="email" value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="pl-10 h-12 rounded-xl border-2 dark:bg-gray-700 dark:border-gray-600"
                      placeholder="example@mail.com" required />
                  </div>
                </div>
                {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
                <Button type="submit" disabled={submitting}
                  className="w-full h-12 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl text-lg shadow-lg">
                  {submitting ? t('Отправляем...', 'Жіберіліуде...') : t('Отправить ссылку', 'Сілтеме жіберу')}
                </Button>
              </form>
            </div>
          )}

          {/* Новый пароль (из ссылки в письме) */}
          {currentView === 'new-password' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-purple-100 dark:bg-purple-900/50 rounded-full mb-3">
                  <Lock className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-gray-900 dark:text-gray-100 mb-1">{t('Новый пароль', 'Жаңа құпия сөз')}</h2>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300">{t('Новый пароль', 'Жаңа құпия сөз')}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input type={showNewPassword ? 'text' : 'password'} value={formData.newPassword}
                      onChange={(e) => handleInputChange('newPassword', e.target.value)}
                      className="pl-10 pr-10 h-12 rounded-xl border-2 dark:bg-gray-700 dark:border-gray-600"
                      placeholder="••••••••" required />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {formData.newPassword && !newPasswordValidation.isValid && (
                    <div className="text-xs space-y-1 mt-1">
                      {[
                        [newPasswordValidation.hasMinLength, t('Минимум 6 символов', 'Кемінде 6 таңба')],
                        [newPasswordValidation.hasUppercase, t('Заглавная буква', 'Бас әріп')],
                        [newPasswordValidation.hasLowercase, t('Строчная буква', 'Кіші әріп')],
                        [newPasswordValidation.hasNumber, t('Цифра', 'Сан')],
                        [newPasswordValidation.hasSpecial, t('Спецсимвол', 'Арнайы таңба')],
                      ].map(([ok, label], i) => (
                        <div key={i} className={`flex items-center gap-1 ${ok ? 'text-green-600' : 'text-gray-400'}`}>
                          {ok ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          <span>{label as string}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300">{t('Подтвердите пароль', 'Құпия сөзді растаңыз')}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input type="password" value={formData.confirmNewPassword}
                      onChange={(e) => handleInputChange('confirmNewPassword', e.target.value)}
                      className="pl-10 h-12 rounded-xl border-2 dark:bg-gray-700 dark:border-gray-600"
                      placeholder="••••••••" required />
                  </div>
                </div>
                {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
                <Button type="submit" disabled={submitting}
                  className="w-full h-12 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl text-lg shadow-lg">
                  {submitting ? t('Сохраняем...', 'Сақталуда...') : t('Сохранить пароль', 'Құпия сөзді сақтау')}
                </Button>
              </form>
            </div>
          )}

          {/* Проверьте почту */}
          {currentView === 'check-email' && (
            <div className="space-y-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900/50 rounded-full mb-2">
                <Mail className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-gray-900 dark:text-gray-100 mb-2">
                  {t('Проверьте почту', 'Поштаңызды тексеріңіз')}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  {t(
                    `Мы отправили письмо на ${pendingEmail}. Нажмите на ссылку в письме, чтобы активировать аккаунт.`,
                    `${pendingEmail} адресіне хат жібердік. Аккаунтты белсендіру үшін хаттағы сілтемені басыңыз.`,
                  )}
                </p>
              </div>
              <div className="space-y-3">
                <Button
                  type="button"
                  disabled={resendStatus !== 'idle'}
                  onClick={handleResend}
                  variant="outline"
                  className="w-full h-11 rounded-xl border-2 dark:border-gray-600"
                >
                  {resendStatus === 'sending'
                    ? t('Отправляем...', 'Жіберіліуде...')
                    : resendStatus === 'sent'
                      ? t('Письмо отправлено!', 'Хат жіберілді!')
                      : t('Отправить письмо ещё раз', 'Хатты қайта жіберу')}
                </Button>
                <button
                  type="button"
                  onClick={() => setCurrentView('login')}
                  className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                >
                  {t('Вернуться к входу', 'Кіруге оралу')}
                </button>
              </div>
            </div>
          )}

        </Card>

        {/* Дополнительная информация */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('Нужна помощь?', 'Көмек керек пе?')}{' '}
            <a href="#" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300">
              {t('Свяжитесь с нами', 'Бізбен байланысыңыз')}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
