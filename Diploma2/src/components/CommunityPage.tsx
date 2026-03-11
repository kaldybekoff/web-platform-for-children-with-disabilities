import { Users, MessageCircle, Heart } from 'lucide-react';
import { Card } from './ui/card';
import { useLanguage } from '../contexts/LanguageContext';

export function CommunityPage() {
  const { t } = useLanguage();

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-2xl mb-4">
          <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
        </div>
        <h2 className="text-purple-700 dark:text-purple-400 mb-4">
          {t('Сообщество', 'Қоғамдастық')}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">
          {t(
            'Здесь ученики и учителя могут общаться, делиться успехами и поддерживать друг друга.',
            'Мұнда оқушылар мен мұғалімдер сөйлесе алады, жетістіктермен бөліседі және бір-бірін қолдайды.'
          )}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <Card className="p-6 bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 text-center">
          <MessageCircle className="w-10 h-10 mx-auto mb-3 text-blue-600 dark:text-blue-400" />
          <h3 className="text-gray-800 dark:text-gray-100 mb-2">
            {t('Обсуждения', 'Талқылаулар')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('Задавайте вопросы по урокам и курсам', 'Сабақтар мен курстар бойынша сұрақ қойыңыз')}
          </p>
        </Card>
        <Card className="p-6 bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 text-center">
          <Heart className="w-10 h-10 mx-auto mb-3 text-pink-600 dark:text-pink-400" />
          <h3 className="text-gray-800 dark:text-gray-100 mb-2">
            {t('Успехи', 'Жетістіктер')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('Делитесь своими достижениями с другими', 'Жетістіктеріңізбен бөлісіңіз')}
          </p>
        </Card>
        <Card className="p-6 bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 text-center">
          <Users className="w-10 h-10 mx-auto mb-3 text-green-600 dark:text-green-400" />
          <h3 className="text-gray-800 dark:text-gray-100 mb-2">
            {t('Друзья по учебе', 'Оқу достары')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('Знакомьтесь с другими учениками платформы', 'Платформаның басқа оқушыларымен танысыңыз')}
          </p>
        </Card>
      </div>

      <p className="text-center text-gray-500 dark:text-gray-400 text-sm mt-10">
        {t('Раздел в разработке. Скоро здесь появится больше возможностей!', 'Бөлім әзірленуде. Жақында мүмкіндіктер көбейеді!')}
      </p>
    </section>
  );
}
