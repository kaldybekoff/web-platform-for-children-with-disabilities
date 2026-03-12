import { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, CheckCircle, GraduationCap, School } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { VerificationCode } from './VerificationCode';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../api/types';

export type { UserRole };

type AuthView = 'login' | 'register' | 'reset' | 'verify-reset' | 'success';
type RegisterRole = 'student' | 'teacher';

export function AuthPage() {
  const { t } = useLanguage();
  const { login, register } = useAuth();
  const [currentView, setCurrentView] = useState<AuthView>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [registerRole, setRegisterRole] = useState<RegisterRole>('student');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (currentView === 'reset') {
      setCurrentView('verify-reset');
      return;
    }

    if (currentView === 'register') {
      if (formData.password !== formData.confirmPassword) {
        setError(t('Пароли не совпадают', 'Құпия сөздер сәйкес келмейді'));
        return;
      }
      setSubmitting(true);
      try {
        await register({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: registerRole,
        });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : t('Ошибка регистрации', 'Тіркелу қатесі'));
      } finally {
        setSubmitting(false);
      }
      return;
    }

    setSubmitting(true);
    try {
      await login(formData.email, formData.password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('Неверный email или пароль', 'Email немесе құпия сөз қате'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerificationComplete = (_code: string) => {
    setCurrentView('login');
  };

  const handleResendCode = () => {
    console.log('Resending code...');
  };

  const handleSocialLogin = (_provider: string) => {
    setError(t('Вход через соцсети пока недоступен', 'Әлеуметтік желі арқылы кіру әзірше қолжетімсіз'));
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

                <button
                  type="button"
                  onClick={() => setCurrentView('reset')}
                  className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                >
                  {t('Забыли пароль?', 'Құпия сөзді ұмыттыңыз ба?')}
                </button>

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

              {/* Разделитель */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    {t('Или войдите через', 'Немесе арқылы кіріңіз')}
                  </span>
                </div>
              </div>

              {/* Социальные кнопки */}
              <div className="space-y-3">
                <Button
                  type="button"
                  onClick={() => handleSocialLogin('google')}
                  variant="outline"
                  className="w-full h-12 rounded-xl border-2 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {t('Войти через Google', 'Google арқылы кіру')}
                  </span>
                </Button>

              </div>

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
                      className="pl-10 h-12 rounded-xl border-2 dark:bg-gray-700 dark:border-gray-600"
                      placeholder="••••••••"
                      required
                    />
                  </div>
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

          {/* Восстановление пароля */}
          {currentView === 'reset' && (
            <div className="space-y-6">
              <button
                onClick={() => setCurrentView('login')}
                className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('Назад', 'Артқа')}
              </button>

              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900/50 rounded-full mb-4">
                  <Mail className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-gray-900 dark:text-gray-100 mb-2">
                  {t('Восстановление пароля', 'Құпия сөзді қалпына келтіру')}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {t(
                    'Введите email, и мы отправим инструкции по восстановлению',
                    'Email енгізіңіз, біз қалпына келтіру нұсқауларын жібереміз'
                  )}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="text-gray-700 dark:text-gray-300">
                    {t('Email', 'Email')}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="reset-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="pl-10 h-12 rounded-xl border-2 dark:bg-gray-700 dark:border-gray-600"
                      placeholder="example@mail.com"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl text-lg shadow-lg"
                >
                  {t('Отправить инструкции', 'Нұсқауларды жіберу')}
                </Button>
              </form>

              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('Вспомнили пароль?', 'Құпия сөзді есіңізде ме?')}{' '}
                  <button
                    onClick={() => setCurrentView('login')}
                    className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                  >
                    {t('Войти', 'Кіру')}
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* Верификация восстановления пароля */}
          {currentView === 'verify-reset' && (
            <div className="space-y-6">
              <button
                onClick={() => setCurrentView('reset')}
                className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('Назад', 'Артқа')}
              </button>

              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900/50 rounded-full mb-4">
                  <Mail className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-gray-900 dark:text-gray-100 mb-2">
                  {t('Восстановление пароля', 'Құпия сөзді қалпына келтіру')}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {t('Введите код подтверждения', 'Растау кодын енгізіңіз')}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300">
                    {t('Код подтверждения', 'Растау коды')}
                  </Label>
                  <VerificationCode
                    onComplete={handleVerificationComplete}
                    onResend={handleResendCode}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl text-lg shadow-lg"
                >
                  {t('Подтвердить', 'Растау')}
                </Button>
              </form>

              <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
                {t(
                  'Нажимая кнопку, вы соглашаетесь на обработку персональных данных',
                  'Батырманы басу арқылы сіз жеке деректерді өңдеуге келісесіз'
                )}
              </div>
            </div>
          )}

          {/* Успешная регистрация (после register сразу логиним, этот экран не показывается) */}
          {currentView === 'success' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-gray-900 dark:text-gray-100 mb-2">
                  {t('Успешная регистрация', 'Тіркелу сәтті')}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {t('Ваш аккаунт успешно создан', 'Аккаунт сәтті жасалды')}
                </p>
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
