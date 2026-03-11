import { BarChart3 } from 'lucide-react';
import { Card } from './ui/card';
import { useLanguage } from '../contexts/LanguageContext';

const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const daysKz = ['Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сб', 'Жк'];
const weekData = [65, 70, 85, 75, 90, 85, 80];
const topCourses = [
  { titleRu: 'Казахский жестовый язык', titleKz: 'Қазақ ым тілі', count: 420, pct: 34 },
  { titleRu: 'Математика для начинающих', titleKz: 'Бастауыштарға арналған математика', count: 250, pct: 20 },
  { titleRu: 'Чтение и письмо', titleKz: 'Оқу және жазу', count: 320, pct: 26 },
];

export function AdminStats() {
  const { t, language } = useLanguage();

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h2 className="text-purple-700 dark:text-purple-400 text-lg">{t('Статистика платформы', 'Платформа статистикасы')}</h2>
          <p className="text-gray-600 dark:text-gray-400 text-xs">{t('Обзор активности и метрик', 'Белсенділік пен метрикаларға шолу')}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-100 dark:border-gray-700">
          <h3 className="text-gray-800 dark:text-gray-100 text-sm font-medium mb-2">{t('Активность за неделю', 'Апта бойы белсенділік')}</h3>
          <div className="flex items-end gap-1.5 h-16">
            {weekData.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full">
                <div className="w-full flex-1 flex flex-col justify-end min-h-[20px]">
                  <div className="w-full bg-purple-500 dark:bg-purple-600 rounded-t" style={{ height: `${val}%`, minHeight: 2 }} />
                </div>
                <span className="text-[10px] text-gray-500 dark:text-gray-400">{language === 'ru' ? days[i] : daysKz[i]}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">{t('Мок: условные данные', 'Мок: шартты деректер')}</p>
        </Card>
        <Card className="p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-100 dark:border-gray-700">
          <h3 className="text-gray-800 dark:text-gray-100 text-sm font-medium mb-2">{t('Топ курсов', 'Танымал курстар')}</h3>
          <ul className="space-y-1.5 text-xs">
            {topCourses.map((c, i) => (
              <li key={i} className="flex justify-between items-center text-gray-700 dark:text-gray-300">
                <span>{i + 1}. {t(c.titleRu, c.titleKz)}</span>
                <span className="text-gray-500 dark:text-gray-400">{c.count} {t('уч.', 'оқ.')} ({c.pct}%)</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">{t('От всех записей', 'Барлық жазбалардан')}</p>
        </Card>
      </div>
    </section>
  );
}
