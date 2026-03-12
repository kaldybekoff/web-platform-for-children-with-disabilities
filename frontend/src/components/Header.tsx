import { Home, BookOpen, Video, Users, Languages, UserCircle, User, Sun, Moon, LogOut, LayoutDashboard, Shield, BarChart3, MessageCircle, Newspaper } from 'lucide-react';
import { Button } from './ui/button';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import type { UserRole } from './AuthPage';

interface HeaderProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  onLogout?: () => void;
  userRole: UserRole;
}

const studentNav = [
  { id: 'home', icon: Home, labelRu: 'Главная', labelKz: 'Басты бет' },
  { id: 'courses', icon: BookOpen, labelRu: 'Курсы', labelKz: 'Курстар' },
  { id: 'lesson', icon: Video, labelRu: 'Урок (демо)', labelKz: 'Сабақ (демо)' },
  { id: 'profile', icon: UserCircle, labelRu: 'Профиль', labelKz: 'Профиль' },
  { id: 'community', icon: Users, labelRu: 'Сообщество', labelKz: 'Қоғамдастық' },
];

const teacherNav = [
  { id: 'home', icon: Home, labelRu: 'Главная', labelKz: 'Басты бет' },
  { id: 'courses', icon: BookOpen, labelRu: 'Мои курсы', labelKz: 'Менің курстарым' },
  { id: 'students', icon: Users, labelRu: 'Ученики', labelKz: 'Оқушылар' },
  { id: 'profile', icon: User, labelRu: 'Профиль', labelKz: 'Профиль' },
  { id: 'community', icon: MessageCircle, labelRu: 'Сообщество', labelKz: 'Қоғамдастық' },
];

const adminNav = [
  { id: 'dashboard', icon: LayoutDashboard, labelRu: 'Панель', labelKz: 'Панель' },
  { id: 'users', icon: Users, labelRu: 'Пользователи', labelKz: 'Пайдаланушылар' },
  { id: 'courses', icon: BookOpen, labelRu: 'Курсы', labelKz: 'Курстар' },
  { id: 'news', icon: Newspaper, labelRu: 'Новости', labelKz: 'Жаңалықтар' },
  { id: 'stats', icon: BarChart3, labelRu: 'Статистика', labelKz: 'Статистика' },
  { id: 'community', icon: Shield, labelRu: 'Модерация', labelKz: 'Модеция' },
];

export function Header({ activeSection, setActiveSection, onLogout, userRole }: HeaderProps) {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const navItems = userRole === 'student' ? studentNav : userRole === 'teacher' ? teacherNav : adminNav;

  const toggleLanguage = () => {
    setLanguage(language === 'ru' ? 'kz' : 'ru');
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50 border-b-4 border-purple-400 dark:border-purple-600 transition-colors duration-300">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Логотип с иконкой жестового языка */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-xl sm:text-2xl">👋</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-purple-600 dark:text-purple-400 text-sm sm:text-base truncate">
                {t('QazEdu Special', 'QazEdu Special')}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                {t('Дистанционное обучение', 'Қашықтықтан оқыту')}
              </p>
            </div>
          </div>

          {/* Визуальная навигация с крупными иконками */}
          <nav className="hidden md:flex gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${isActive
                      ? 'bg-purple-500 text-white shadow-lg scale-105'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900'
                    }`}
                >
                  <Icon className={`w-6 h-6 ${isActive ? 'animate-bounce' : ''}`} />
                  <span className="text-xs">{language === 'ru' ? item.labelRu : item.labelKz}</span>
                </button>
              );
            })}
          </nav>

          {/* Переключатель языка и темы */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              onClick={toggleTheme}
              variant="outline"
              size="icon"
              className="rounded-full w-10 h-10 sm:w-12 sm:h-12 dark:border-gray-600 dark:hover:bg-gray-700"
              title={t('Переключить тему', 'Тақырыпты ауыстыру')}
            >
              {theme === 'light' ? <Moon className="w-5 h-5 sm:w-6 sm:h-6" /> : <Sun className="w-5 h-5 sm:w-6 sm:h-6" />}
            </Button>
            <Button
              onClick={toggleLanguage}
              variant="outline"
              size="icon"
              className="rounded-full w-10 h-10 sm:w-12 sm:h-12 relative dark:border-gray-600 dark:hover:bg-gray-700"
              title={t('Переключить на казахский', 'Орысшаға ауыстыру')}
            >
              <Languages className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="absolute -bottom-1 -right-1 bg-purple-600 text-white text-xs px-1 sm:px-1.5 py-0.5 rounded-full">
                {language.toUpperCase()}
              </span>
            </Button>
            {onLogout && (
              <Button
                onClick={onLogout}
                variant="outline"
                size="icon"
                className="rounded-full w-10 h-10 sm:w-12 sm:h-12 dark:border-gray-600 dark:hover:bg-gray-700"
                title={t('Выйти', 'Шығу')}
              >
                <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
            )}
          </div>
        </div>

        {/* Мобильная навигация */}
        <nav className="md:hidden flex gap-2 mt-4 overflow-x-auto pb-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all flex-shrink-0 ${isActive
                    ? 'bg-purple-500 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs whitespace-nowrap">{language === 'ru' ? item.labelRu : item.labelKz}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}