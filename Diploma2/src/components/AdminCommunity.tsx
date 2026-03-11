import { useState } from 'react';
import { Shield, MessageSquare, FileText } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { useLanguage } from '../contexts/LanguageContext';

export function AdminCommunity() {
  const { t } = useLanguage();
  const [moderationPending, setModerationPending] = useState(0);
  const [newsCount, setNewsCount] = useState(5);
  const [moderationFeedback, setModerationFeedback] = useState('');
  const [newsFeedback, setNewsFeedback] = useState('');

  const handleCheckQueue = () => {
    if (moderationPending > 0) {
      setModerationPending(0);
      setModerationFeedback(t('Очередь проверена (мок)', 'Кезек тексерілді (мок)'));
    } else {
      setModerationFeedback(t('Очередь пуста', 'Кезек бос'));
    }
    setTimeout(() => setModerationFeedback(''), 2500);
  };

  const handlePublishNews = () => {
    setNewsCount((n) => n + 1);
    setNewsFeedback(t('Новость опубликована (мок)', 'Жаңалық жарияланды (мок)'));
    setTimeout(() => setNewsFeedback(''), 2500);
  };

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-xl flex items-center justify-center">
          <Shield className="w-5 h-5 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <h2 className="text-purple-700 dark:text-purple-400 text-lg">{t('Модерация сообщества', 'Қоғамдастықты модециялау')}</h2>
          <p className="text-gray-600 dark:text-gray-400 text-xs">{t('Новости и модерация контента', 'Жаңалықтар және мазмұнды модециялау')}</p>
        </div>
      </div>

      {(moderationFeedback || newsFeedback) && (
        <p className="text-sm text-green-600 dark:text-green-400 mb-3 rounded-lg bg-green-50 dark:bg-green-900/30 px-3 py-2">{moderationFeedback || newsFeedback}</p>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-100 dark:border-gray-700">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-gray-800 dark:text-gray-100 text-sm font-medium">{t('Сообщения на модерации', 'Модециядағы хабарламалар')}</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{t('Ожидают проверки', 'Тексеруді күтуде')}: {moderationPending}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{t('Мок: очередь', 'Мок: кезек')}</p>
              <Button size="sm" className="mt-2 rounded-lg h-8 text-xs bg-blue-600 hover:bg-blue-700" onClick={handleCheckQueue}>
                {t('Проверить очередь', 'Кезекті тексеру')}
              </Button>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-100 dark:border-gray-700">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-gray-800 dark:text-gray-100 text-sm font-medium">{t('Новости платформы', 'Платформа жаңалықтары')}</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{t('Опубликовано', 'Жарияланды')}: {newsCount}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{t('Мок: создание и публикация', 'Мок: жасау және жариялау')}</p>
              <Button size="sm" className="mt-2 rounded-lg h-8 text-xs bg-green-600 hover:bg-green-700" onClick={handlePublishNews}>
                {t('Опубликовать новость', 'Жаңалық жариялау')}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
