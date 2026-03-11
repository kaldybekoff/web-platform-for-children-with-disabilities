import { Mail, Phone, MapPin, Facebook, Instagram, Youtube } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-gradient-to-br from-purple-900 to-blue-900 dark:from-gray-900 dark:to-gray-950 text-white mt-16 transition-colors duration-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* О платформе */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-white dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👋</span>
              </div>
              <h3 className="text-white">
                {t('QazEdu Special', 'QazEdu Special')}
              </h3>
            </div>
            <p className="text-purple-200 dark:text-gray-400 text-sm">
              {t(
                'Современная платформа дистанционного обучения для слабослышащих детей с использованием жестового языка.',
                'Ым тілін қолданатын есту мүмкіндігі шектеулі балаларға арналған заманауи қашықтықтан оқыту платформасы.'
              )}
            </p>
          </div>

          {/* Быстрые ссылки */}
          <div>
            <h4 className="text-white mb-4">{t('Ссылки', 'Сілтемелер')}</h4>
            <ul className="space-y-2 text-purple-200 dark:text-gray-400 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">{t('О платформе', 'Платформа туралы')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('Курсы', 'Курстар')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('Учителя', 'Мұғалімдер')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
            </ul>
          </div>

          {/* Контакты */}
          <div>
            <h4 className="text-white mb-4">{t('Контакты', 'Байланыс')}</h4>
            <ul className="space-y-3 text-purple-200 dark:text-gray-400 text-sm">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>+7 (700) 123-45-67</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>info@signschool.kz</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{t('Алматы, Казахстан', 'Алматы, Қазақстан')}</span>
              </li>
            </ul>
          </div>

          {/* Социальные сети */}
          <div>
            <h4 className="text-white mb-4">{t('Мы в соцсетях', 'Біз әлеуметтік желілерде')}</h4>
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 bg-white/10 hover:bg-white/20 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 hover:bg-white/20 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 hover:bg-white/20 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
            <p className="text-purple-200 dark:text-gray-400 text-sm mt-4">
              {t(
                'Следите за нашими новостями и обновлениями!',
                'Біздің жаңалықтар мен жаңартуларымызды қадағалаңыз!'
              )}
            </p>
          </div>
        </div>

        <div className="border-t border-purple-700 dark:border-gray-800 mt-8 pt-8 text-center text-purple-200 dark:text-gray-400 text-sm">
          <p>© 2025 {t('QazEdu Special', 'QazEdu Special')}. {t('Платформа дистанционного обучение. Все права защищены.', 'Қашықтықтан оқыту платформасы. Барлық құқықтар қорғалған.')}</p>
        </div>
      </div>
    </footer>
  );
}