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
      bgColor: 'bg-purple-100 dark:bg-purple-900',
      iconColor: 'text-purple-600 dark:text-purple-300',
    },
    {
      icon: Subtitles,
      titleRu: 'Субтитры и текст',
      titleKz: 'Субтитрлер және мәтін',
      descriptionRu: 'Синхронизированные субтитры к каждому видео',
      descriptionKz: 'Әрбір видеоға синхрондалған субтитрлер',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
      iconColor: 'text-blue-600 dark:text-blue-300',
    },
    {
      icon: HandMetal,
      titleRu: 'Интерактивные задания',
      titleKz: 'Интерактивті тапсырмалар',
      descriptionRu: 'Учись жестам через игровые упражнения',
      descriptionKz: 'Ойын жаттығулары арқылы ым тілін үйрен',
      bgColor: 'bg-green-100 dark:bg-green-900',
      iconColor: 'text-green-600 dark:text-green-300',
    },
    {
      icon: MessageCircle,
      titleRu: 'Онлайн поддержка',
      titleKz: 'Онлайн қолдау',
      descriptionRu: 'Чат с учителями и видеозвонки',
      descriptionKz: 'Мұғалімдермен чат және бейне қоңыраулар',
      bgColor: 'bg-orange-100 dark:bg-orange-900',
      iconColor: 'text-orange-600 dark:text-orange-300',
    },
    {
      icon: Trophy,
      titleRu: 'Система достижений',
      titleKz: 'Жетістіктер жүйесі',
      descriptionRu: 'Получай награды за прогресс',
      descriptionKz: 'Прогресс үшін марапаттар ал',
      bgColor: 'bg-pink-100 dark:bg-pink-900',
      iconColor: 'text-pink-600 dark:text-pink-300',
    },
    {
      icon: Clock,
      titleRu: 'Гибкий график',
      titleKz: 'Икемді кесте',
      descriptionRu: 'Учись в любое удобное время',
      descriptionKz: 'Кез келген ыңғайлы уақытта оқы',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900',
      iconColor: 'text-indigo-600 dark:text-indigo-300',
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
              <div className={`w-16 h-16 rounded-2xl ${feature.bgColor} flex items-center justify-center mb-4`}>
                <Icon className={`w-8 h-8 ${feature.iconColor}`} />
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