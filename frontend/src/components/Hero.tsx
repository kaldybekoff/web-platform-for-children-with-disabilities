import { Play, BookOpen, Users } from 'lucide-react';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useLanguage } from '../contexts/LanguageContext';

interface HeroProps {
  setActiveSection: (section: string) => void;
}

export function Hero({ setActiveSection }: HeroProps) {
  const { t } = useLanguage();

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="grid md:grid-cols-2 gap-8 items-center">
        {/* Левая колонка - текст и CTA */}
        <div className="space-y-6">
          <div className="inline-block bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-full">
            <span className="text-xl mr-2">🎓</span>
            {t('Для слабослышащих детей', 'Есту мүмкіндігі шектеулі балаларға арналған')}
          </div>

          <h1 className="text-purple-700 dark:text-purple-400">
            {t('Обучение с языком жестов', 'Ым тілімен оқыту')}
          </h1>

          <p className="text-gray-600 dark:text-gray-300 text-base sm:text-xl">
            {t(
              'Дистанционная платформа с видеоуроками на жестовом языке, интерактивными заданиями и поддержкой учителей',
              'Ым тілінде видеосабақтары, интерактивті тапсырмалары және мұғалімдердің қолдауы бар қашықтықтан оқыту платформасы'
            )}
          </p>

          {/* Статистика */}
          <div className="flex flex-wrap gap-4 sm:gap-6 py-4 justify-center sm:justify-start">
            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-2">
                <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-purple-700 dark:text-purple-400 text-lg sm:text-xl">50+</div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('Курсов', 'Курстар')}</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 dark:bg-green-900 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-2">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-purple-700 dark:text-purple-400 text-lg sm:text-xl">1000+</div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('Учеников', 'Оқушылар')}</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 dark:bg-orange-900 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-2">
                <Play className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="text-purple-700 dark:text-purple-400 text-lg sm:text-xl">500+</div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('Видеоуроков', 'Видеосабақтар')}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-base sm:text-xl px-4 sm:px-8 py-3 sm:py-6 rounded-2xl shadow-xl" onClick={() => setActiveSection('courses')}>
              <Play className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
              {t('Начать обучение', 'Оқуды бастау')}
            </Button>
            <Button size="lg" variant="outline" className="text-base sm:text-xl px-4 sm:px-8 py-3 sm:py-6 rounded-2xl border-2 border-purple-300 dark:border-purple-600 dark:hover:bg-purple-900" onClick={() => setActiveSection('lesson')}>
              {t('Демо урок', 'Демо сабақ')}
            </Button>
          </div>
        </div>

        {/* Правая колонка - видео превью */}
        <div className="relative">
          <div className="aspect-video bg-gradient-to-br from-purple-300 to-blue-300 dark:from-purple-700 dark:to-blue-700 rounded-3xl shadow-2xl overflow-hidden relative">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800"
              alt="Sign language teacher"
              className="w-full h-full object-cover"
            />

            {/* Overlay с кнопкой воспроизведения */}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <button className="w-20 h-20 bg-white dark:bg-gray-200 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
                <Play className="w-10 h-10 text-purple-600 ml-1" fill="currentColor" />
              </button>
            </div>

            {/* Индикатор "Жестовый перевод" */}
            <div className="absolute bottom-4 right-4 bg-purple-600 dark:bg-purple-700 text-white px-4 py-2 rounded-full flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span>{t('Жестовый перевод', 'Ым тілі аудармасы')}</span>
            </div>
          </div>

          {/* Декоративные элементы */}
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-yellow-300 dark:bg-yellow-500 rounded-full opacity-50 blur-xl"></div>
          <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-pink-300 dark:bg-pink-500 rounded-full opacity-50 blur-xl"></div>
        </div>
      </div>
    </section>
  );
}