import { Video, Subtitles, HandMetal, MessageCircle, Trophy, Clock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export function FeaturesSection() {
  const { t } = useLanguage();

  const features = [
    {
      icon: Video,
      titleRu: 'Видео с жестовым языком',
      titleKz: 'Ым тілімен видео',
      descriptionRu: 'Все уроки с профессиональным сурдопереводом',
      descriptionKz: 'Барлық сабақтар кәсіби сурдоаударма',
      color: 'from-purple-400 to-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      icon: Subtitles,
      titleRu: 'Субтитры и текст',
      titleKz: 'Субтитрлер және мәтін',
      descriptionRu: 'Синхронизированные субтитры к каждому видео',
      descriptionKz: 'Әрбір видеоға синхрондалған субтитрлер',
      color: 'from-blue-400 to-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      icon: HandMetal,
      titleRu: 'Интерактивные задания',
      titleKz: 'Интерактивті тапсырмалар',
      descriptionRu: 'Учись жестам через игровые упражнения',
      descriptionKz: 'Ойын жаттығулары арқылы ым тілін үйрен',
      color: 'from-green-400 to-green-600',
      bgColor: 'bg-green-100',
    },
    {
      icon: MessageCircle,
      titleRu: 'Онлайн поддержка',
      titleKz: 'Онлайн қолдау',
      descriptionRu: 'Чат с учителями и видеозвонки',
      descriptionKz: 'Мұғалімдермен чат және бейне қоңыраулар',
      color: 'from-orange-400 to-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      icon: Trophy,
      titleRu: 'Система достижений',
      titleKz: 'Жетістіктер жүйесі',
      descriptionRu: 'Получай награды за прогресс',
      descriptionKz: 'Прогресс үшін марапаттар ал',
      color: 'from-pink-400 to-pink-600',
      bgColor: 'bg-pink-100',
    },
    {
      icon: Clock,
      titleRu: 'Гибкий график',
      titleKz: 'Икемді кесте',
      descriptionRu: 'Учись в любое удобное время',
      descriptionKz: 'Кез келген ыңғайлы уақытта оқы',
      color: 'from-indigo-400 to-indigo-600',
      bgColor: 'bg-indigo-100',
    },
  ];

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-purple-700 dark:text-purple-400 mb-4">
          {t('Особенности платформы', 'Платформа ерекшеліктері')}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-xl">
          {t(
            'Все что нужно для комфортного дистанционного обучения',
            'Ыңғайлы қашықтықтан оқыту үшін қажет нәрселердің бәрі'
          )}
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-2 border-2 border-gray-100 dark:border-gray-700"
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                <Icon className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-gray-800 dark:text-gray-100 mb-2">
                {t(feature.titleRu, feature.titleKz)}
              </h3>

              <p className="text-gray-600 dark:text-gray-400">
                {t(feature.descriptionRu, feature.descriptionKz)}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}