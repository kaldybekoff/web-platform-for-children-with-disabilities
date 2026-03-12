import { useEffect, useState, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, ChevronRight, CheckCircle, XCircle, Hand, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Card } from './ui/card';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useLanguage } from '../contexts/LanguageContext';
import { QuizPlayer } from './QuizPlayer';
import * as lessonsApi from '../api/lessons';
import * as progressApi from '../api/progress';
import type { LessonResponse, LessonProgressResponse } from '../api/types';

interface InteractiveLessonDemoProps {
  courseId?: number | null;
  lessonId?: number | null;
  setActiveSection?: (section: string) => void;
  onSelectLesson?: (lessonId: number | null) => void;
}

type VideoType = 'youtube' | 'vimeo' | 'direct' | null;

function getVideoType(url: string | null | undefined): VideoType {
  if (!url) return null;
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('vimeo.com')) return 'vimeo';
  return 'direct';
}

function getYouTubeEmbedUrl(url: string): string {
  let videoId = '';
  if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split(/[?&#]/)[0] || '';
  } else if (url.includes('youtube.com/watch')) {
    const urlParams = new URLSearchParams(url.split('?')[1]);
    videoId = urlParams.get('v') || '';
  } else if (url.includes('youtube.com/embed/')) {
    videoId = url.split('youtube.com/embed/')[1]?.split(/[?&#]/)[0] || '';
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0` : url;
}

function getVimeoEmbedUrl(url: string): string {
  const match = url.match(/vimeo\.com\/(\d+)/);
  const videoId = match ? match[1] : '';
  return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
}

// Demo lesson data - used when no course is selected
const DEMO_LESSON = {
  title_ru: 'Демонстрационный урок английского языка',
  title_kz: 'Ағылшын тілі бойынша демонстрациялық сабақ',
  description_ru: `Этот демонстрационный урок помогает студентам изучать простые английские приветствия и повседневные выражения.

В этом уроке студенты смотрят короткое видео, знакомятся с базовыми фразами и отвечают на несколько вопросов, чтобы проверить понимание.

Цель урока — сделать первое знакомство с платформой простым, понятным и интерактивным.`,
  description_kz: `Бұл демонстрациялық сабақ студенттерге ағылшын тіліндегі қарапайым амандасу сөздері мен күнделікті қолданылатын тіркестерді үйренуге көмектеседі.

Осы сабақта студенттер қысқа бейне көреді, негізгі сөз тіркестерімен танысады және түсінігін тексеру үшін бірнеше сұраққа жауап береді.

Сабақтың мақсаты — платформадағы алғашқы тәжірибені жеңіл, түсінікті және интерактивті ету.`,
  video_url: 'https://youtu.be/jtbwEalS0CE?si=cp1KA6_rcxGtfTLW',
};

const DEMO_QUIZ_QUESTIONS = [
  {
    id: 1,
    text_ru: 'Какая основная тема этого демонстрационного урока?',
    text_kz: 'Бұл демонстрациялық сабақтың негізгі тақырыбы қандай?',
    answers: [
      { id: 1, text_ru: 'Английские приветствия', text_kz: 'Ағылшын тіліндегі амандасу сөздері', is_correct: true },
      { id: 2, text_ru: 'Высшая математика', text_kz: 'Жоғары математика', is_correct: false },
      { id: 3, text_ru: 'Всемирная история', text_kz: 'Дүниежүзі тарихы', is_correct: false },
    ],
  },
  {
    id: 2,
    text_ru: 'Какова цель этого урока?',
    text_kz: 'Бұл сабақтың мақсаты қандай?',
    answers: [
      { id: 4, text_ru: 'Практиковать простые английские выражения', text_kz: 'Қарапайым ағылшын тіркестерін жаттықтыру', is_correct: true },
      { id: 5, text_ru: 'Изучать программирование', text_kz: 'Бағдарламалауды оқу', is_correct: false },
      { id: 6, text_ru: 'Изучать химию', text_kz: 'Химияны оқу', is_correct: false },
    ],
  },
  {
    id: 3,
    text_ru: 'Что должен сделать студент после просмотра видео?',
    text_kz: 'Бейнені көргеннен кейін студент не істеуі керек?',
    answers: [
      { id: 7, text_ru: 'Ответить на вопросы квиза', text_kz: 'Квиз сұрақтарына жауап беру', is_correct: true },
      { id: 8, text_ru: 'Закрыть сайт', text_kz: 'Сайтты жабу', is_correct: false },
      { id: 9, text_ru: 'Написать длинное эссе', text_kz: 'Ұзақ эссе жазу', is_correct: false },
    ],
  },
];

export function InteractiveLessonDemo({ courseId, lessonId, setActiveSection, onSelectLesson }: InteractiveLessonDemoProps) {
  const { t, language } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [lessons, setLessons] = useState<LessonResponse[]>([]);
  const [currentLesson, setCurrentLesson] = useState<LessonResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lessonProgress, setLessonProgress] = useState<LessonProgressResponse | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  
  // Demo quiz state
  const [demoQuizCurrentQuestion, setDemoQuizCurrentQuestion] = useState(0);
  const [demoQuizSelectedAnswers, setDemoQuizSelectedAnswers] = useState<Record<number, number>>({});
  const [demoQuizChecked, setDemoQuizChecked] = useState<Record<number, { isCorrect: boolean; correctId: number }>>({});
  const [demoQuizCompleted, setDemoQuizCompleted] = useState(false);
  
  // Check if we're in pure demo mode (no course selected)
  const isDemoMode = !courseId;

  useEffect(() => {
    if (!courseId) {
      setLessons([]);
      setCurrentLesson(null);
      return;
    }
    setLoading(true);
    setError(null);
    lessonsApi
      .listLessonsByCourse(courseId)
      .then((list) => {
        setLessons(list);
        if (lessonId) {
          lessonsApi.getLesson(lessonId).then(setCurrentLesson).catch(() => setCurrentLesson(null));
        } else if (list.length) {
          setCurrentLesson(list[0]);
          onSelectLesson?.(list[0].id);
        } else {
          setCurrentLesson(null);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Ошибка'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  useEffect(() => {
    if (!lessonId || !lessons.length) return;
    const found = lessons.find((l) => l.id === lessonId);
    if (found) {
      setCurrentLesson(found);
      loadLessonProgress(found.id);
    } else {
      lessonsApi.getLesson(lessonId).then((lesson) => {
        setCurrentLesson(lesson);
        loadLessonProgress(lesson.id);
      }).catch(() => setCurrentLesson(null));
    }
  }, [lessonId, lessons]);

  const loadLessonProgress = async (id: number) => {
    try {
      const progress = await progressApi.getLessonProgress(id);
      setLessonProgress(progress);
    } catch {
      setLessonProgress(null);
    }
  };

  const handleMarkComplete = async () => {
    if (!currentLesson) return;
    try {
      const progress = await progressApi.markLessonComplete(currentLesson.id, {
        watch_time_seconds: Math.floor(videoProgress),
      });
      setLessonProgress(progress);
    } catch (err) {
      console.error('Failed to mark lesson complete:', err);
    }
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      setVideoProgress(videoRef.current.currentTime);
      setVideoDuration(videoRef.current.duration || 0);
    }
  };

  const handleVideoPlay = () => setIsPlaying(true);
  const handleVideoPause = () => setIsPlaying(false);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleQuizComplete = (passed: boolean, score: number) => {
    setQuizPassed(passed);
    if (passed) {
      handleMarkComplete();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Demo quiz handlers
  const handleDemoQuizSelectAnswer = (questionId: number, answerId: number) => {
    if (demoQuizChecked[questionId]) return;
    setDemoQuizSelectedAnswers((prev) => ({ ...prev, [questionId]: answerId }));
  };

  const handleDemoQuizCheck = () => {
    const question = DEMO_QUIZ_QUESTIONS[demoQuizCurrentQuestion];
    const selectedId = demoQuizSelectedAnswers[question.id];
    const correctAnswer = question.answers.find((a) => a.is_correct);
    const isCorrect = correctAnswer?.id === selectedId;
    setDemoQuizChecked((prev) => ({
      ...prev,
      [question.id]: { isCorrect, correctId: correctAnswer?.id || 0 },
    }));
  };

  const handleDemoQuizNext = () => {
    if (demoQuizCurrentQuestion < DEMO_QUIZ_QUESTIONS.length - 1) {
      setDemoQuizCurrentQuestion((prev) => prev + 1);
    }
  };

  const handleDemoQuizFinish = () => {
    const correctCount = Object.values(demoQuizChecked).filter((c) => c.isCorrect).length;
    const passed = correctCount >= 2;
    setDemoQuizCompleted(true);
    setQuizPassed(passed);
  };

  const handleDemoQuizRetry = () => {
    setDemoQuizCurrentQuestion(0);
    setDemoQuizSelectedAnswers({});
    setDemoQuizChecked({});
    setDemoQuizCompleted(false);
    setQuizPassed(false);
  };

  // Determine what to show - demo or real lesson
  const title = isDemoMode 
    ? (language === 'kz' ? DEMO_LESSON.title_kz : DEMO_LESSON.title_ru)
    : currentLesson?.title || t('Демо урок: Приветствия на жестовом языке', 'Демо сабақ: Ым тіліндегі сәлемдесулер');
  
  const description = isDemoMode
    ? (language === 'kz' ? DEMO_LESSON.description_kz : DEMO_LESSON.description_ru)
    : currentLesson?.content?.trim() || '';
  
  const videoUrl = isDemoMode ? DEMO_LESSON.video_url : currentLesson?.video_url;
  const videoType = getVideoType(videoUrl);
  const embedUrl = videoType === 'youtube' 
    ? getYouTubeEmbedUrl(videoUrl || '')
    : videoType === 'vimeo'
    ? getVimeoEmbedUrl(videoUrl || '')
    : videoUrl;

  if (loading) {
    return (
      <section className="container mx-auto px-4 py-8">
        <p className="text-purple-600 dark:text-purple-400">{t('Загрузка урока...', 'Сабақ жүктелуде...')}</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="container mx-auto px-4 py-8">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 py-8">
      {/* Back button */}
      <button
        onClick={() => setActiveSection?.('courses')}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">{t('Назад к курсам', 'Курстарға қайту')}</span>
      </button>

      <div className="mb-4 sm:mb-6">
        <h2 className="text-purple-700 dark:text-purple-400 mb-2 text-lg sm:text-xl lg:text-2xl">{title}</h2>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Основной видеоплеер */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="overflow-hidden dark:bg-gray-800 dark:border-gray-700">
            {/* Видео область */}
            <div className="relative aspect-video bg-gradient-to-br from-purple-300 to-blue-300 dark:from-purple-700 dark:to-blue-700">
              {/* YouTube или Vimeo — используем iframe */}
              {(videoType === 'youtube' || videoType === 'vimeo') && embedUrl && (
                <iframe
                  src={embedUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  title={title}
                />
              )}

              {/* Прямая ссылка на видео — используем video тег */}
              {videoType === 'direct' && videoUrl && (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full h-full object-cover"
                  onTimeUpdate={handleVideoTimeUpdate}
                  onPlay={handleVideoPlay}
                  onPause={handleVideoPause}
                  onEnded={handleMarkComplete}
                  controls
                >
                  {currentLesson?.subtitle_url && (
                    <track
                      kind="subtitles"
                      src={currentLesson.subtitle_url}
                      srcLang="ru"
                      label="Русский"
                      default
                    />
                  )}
                </video>
              )}

              {/* Нет видео — показываем placeholder */}
              {!videoUrl && (
                <>
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1000"
                    alt="Sign language lesson"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <div className="absolute bottom-20 left-0 right-0 px-8">
                    <div className="bg-black/80 text-white px-6 py-3 rounded-xl text-center backdrop-blur-sm">
                      <p className="text-xl">
                        {t(
                          'Видео для этого урока пока не загружено',
                          'Бұл сабаққа видео әлі жүктелмеген'
                        )}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Индикатор жестового перевода */}
              {currentLesson?.has_sign_language && (
                <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full flex items-center gap-2 z-10">
                  <Hand className="w-4 h-4" />
                  <span>{t('С жестовым переводом', 'Ым тілі аудармасымен')}</span>
                </div>
              )}

              {/* Demo lesson badge */}
              {isDemoMode && (
                <div className="absolute top-4 left-4 bg-purple-600 text-white px-4 py-2 rounded-full flex items-center gap-2 z-10">
                  <span>{t('Демо урок', 'Демо сабақ')}</span>
                </div>
              )}

              {/* Контролы для прямого видео (не YouTube/Vimeo) */}
              {videoType === 'direct' && videoUrl && !isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-20 h-20 bg-white/90 dark:bg-gray-200/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-2xl">
                    <Play className="w-10 h-10 text-purple-600 ml-1" fill="currentColor" />
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Описание урока */}
          <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
            <h3 className="text-gray-800 dark:text-gray-100 mb-4">
              {t('Описание урока', 'Сабақ сипаттамасы')}
            </h3>
            {description ? (
              <p className="text-gray-600 dark:text-gray-400 mb-4 whitespace-pre-wrap">
                {description}
              </p>
            ) : (
              <p className="text-gray-400 dark:text-gray-500 mb-4 italic">
                {t('Описание не указано', 'Сипаттама көрсетілмеген')}
              </p>
            )}

            {/* Demo content - only shown for demo lessons */}
            {currentLesson?.is_demo && (
              <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-6">
                <div className="text-center p-3 sm:p-4 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
                  <div className="text-2xl sm:text-3xl mb-2">👋</div>
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">{t('Привет', 'Сәлем')}</p>
                </div>
                <div className="text-center p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                  <div className="text-2xl sm:text-3xl mb-2">🙏</div>
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">{t('Спасибо', 'Рахмет')}</p>
                </div>
                <div className="text-center p-3 sm:p-4 bg-green-50 dark:bg-green-900/30 rounded-xl">
                  <div className="text-2xl sm:text-3xl mb-2">👋</div>
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">{t('Пока', 'Сау бол')}</p>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Боковая панель с заданиями */}
        <div className="space-y-4">
          {/* Quiz section - Demo Quiz or Real Quiz */}
          {(isDemoMode || currentLesson) && (
            <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-800 dark:text-gray-100">
                  {t('Тест к уроку', 'Сабаққа тест')}
                </h3>
                {!showQuiz && !demoQuizCompleted && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowQuiz(true)}
                    className="text-xs"
                  >
                    {t('Пройти тест', 'Тестті өту')}
                  </Button>
                )}
              </div>

              {/* Demo Quiz */}
              {isDemoMode && showQuiz && !demoQuizCompleted && (
                <div className="space-y-4">
                  <Progress value={((demoQuizCurrentQuestion + 1) / DEMO_QUIZ_QUESTIONS.length) * 100} className="h-2" />
                  
                  {(() => {
                    const question = DEMO_QUIZ_QUESTIONS[demoQuizCurrentQuestion];
                    const isChecked = demoQuizChecked[question.id] !== undefined;
                    const checkedData = demoQuizChecked[question.id];
                    const selectedId = demoQuizSelectedAnswers[question.id];
                    const isLastQuestion = demoQuizCurrentQuestion === DEMO_QUIZ_QUESTIONS.length - 1;
                    
                    return (
                      <>
                        <p className="text-gray-800 dark:text-gray-100 font-medium">
                          {language === 'kz' ? question.text_kz : question.text_ru}
                        </p>
                        
                        <div className="space-y-2">
                          {question.answers.map((answer) => {
                            const isSelected = selectedId === answer.id;
                            const isCorrect = checkedData?.correctId === answer.id;
                            const isWrong = isChecked && isSelected && !checkedData?.isCorrect;
                            
                            let btnClass = 'w-full p-3 rounded-xl border-2 transition-all text-left text-sm ';
                            if (isChecked) {
                              if (isCorrect) btnClass += 'border-green-500 bg-green-50 dark:bg-green-900/30';
                              else if (isWrong) btnClass += 'border-red-500 bg-red-50 dark:bg-red-900/30';
                              else btnClass += 'border-gray-300 dark:border-gray-600 opacity-50';
                            } else {
                              if (isSelected) btnClass += 'border-purple-500 bg-purple-50 dark:bg-purple-900/30';
                              else btnClass += 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500';
                            }
                            
                            return (
                              <button
                                key={answer.id}
                                onClick={() => handleDemoQuizSelectAnswer(question.id, answer.id)}
                                disabled={isChecked}
                                className={btnClass}
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                    isChecked && isCorrect ? 'border-green-500 bg-green-500' :
                                    isWrong ? 'border-red-500 bg-red-500' :
                                    isSelected ? 'border-purple-500 bg-purple-500' :
                                    'border-gray-300'
                                  }`}>
                                    {(isSelected || isCorrect) && (
                                      <CheckCircle className="w-2.5 h-2.5 text-white" />
                                    )}
                                    {isWrong && (
                                      <XCircle className="w-2.5 h-2.5 text-white" />
                                    )}
                                  </div>
                                  <span className="text-gray-700 dark:text-gray-300">
                                    {language === 'kz' ? answer.text_kz : answer.text_ru}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        
                        {isChecked && (
                          <div className={`p-2 rounded-lg text-sm ${
                            checkedData?.isCorrect 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          }`}>
                            {checkedData?.isCorrect 
                              ? t('✓ Правильно!', '✓ Дұрыс!')
                              : t('✗ Неправильно', '✗ Қате')}
                          </div>
                        )}
                        
                        <div className="flex flex-wrap gap-2 pt-2">
                          {!isChecked ? (
                            <Button
                              onClick={handleDemoQuizCheck}
                              disabled={!selectedId}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                            >
                              {t('Проверить', 'Тексеру')}
                            </Button>
                          ) : (
                            <>
                              {!isLastQuestion ? (
                                <Button
                                  onClick={handleDemoQuizNext}
                                  size="sm"
                                  className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto"
                                >
                                  {t('Далее', 'Келесі')}
                                </Button>
                              ) : (
                                <Button
                                  onClick={handleDemoQuizFinish}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                                >
                                  {t('Завершить тест', 'Тестті аяқтау')}
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Demo Quiz Result */}
              {isDemoMode && demoQuizCompleted && (
                <div className="text-center space-y-3">
                  {quizPassed ? (
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
                      <XCircle className="w-6 h-6 text-red-600" />
                    </div>
                  )}
                  <p className={quizPassed ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                    {quizPassed 
                      ? t('Тест пройден!', 'Тест өтілді!') 
                      : t('Тест не пройден', 'Тест өтілмеді')}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {t('Правильных ответов:', 'Дұрыс жауаптар:')} {Object.values(demoQuizChecked).filter(c => c.isCorrect).length} / {DEMO_QUIZ_QUESTIONS.length}
                  </p>
                  <Button onClick={handleDemoQuizRetry} variant="outline" size="sm">
                    {t('Пройти заново', 'Қайта өту')}
                  </Button>
                </div>
              )}

              {/* Real Quiz for non-demo lessons */}
              {!isDemoMode && currentLesson && showQuiz && (
                <QuizPlayer
                  lessonId={currentLesson.id}
                  onComplete={handleQuizComplete}
                />
              )}

              {/* Prompt to start quiz */}
              {!showQuiz && !demoQuizCompleted && (
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {quizPassed
                    ? t('✓ Тест пройден!', '✓ Тест өтілді!')
                    : t('Нажмите кнопку, чтобы начать тест', 'Тестті бастау үшін батырманы басыңыз')}
                </p>
              )}
            </Card>
          )}

          {/* Прогресс урока */}
          <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
            <h3 className="text-gray-800 dark:text-gray-100 mb-4">
              {isDemoMode ? t('Прогресс демо', 'Демо үлгерімі') : t('Прогресс урока', 'Сабақ үлгерімі')}
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                {isDemoMode ? (
                  <>
                    <div className={`flex items-center gap-2 text-sm ${showQuiz ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                      {showQuiz ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded-full"></div>
                      )}
                      <span>{t('Видео просмотрено', 'Видео көрілді')}</span>
                    </div>
                    <div className={`flex items-center gap-2 text-sm ${quizPassed ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                      {quizPassed ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded-full"></div>
                      )}
                      <span>{t('Тест пройден', 'Тест өтілді')}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={`flex items-center gap-2 text-sm ${lessonProgress?.completed ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                      {lessonProgress?.completed ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded-full"></div>
                      )}
                      <span>{t('Урок завершен', 'Сабақ аяқталды')}</span>
                    </div>
                    <div className={`flex items-center gap-2 text-sm ${quizPassed ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                      {quizPassed ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded-full"></div>
                      )}
                      <span>{t('Тест пройден', 'Тест өтілді')}</span>
                    </div>
                  </>
                )}
              </div>

              {!isDemoMode && !lessonProgress?.completed && (
                <Button
                  onClick={handleMarkComplete}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  {t('Отметить урок завершенным', 'Сабақты аяқталған деп белгілеу')}
                </Button>
              )}

              {isDemoMode && (
                <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    {t(
                      'Это демонстрационный урок. Запишитесь на курс, чтобы получить полный доступ!',
                      'Бұл демонстрациялық сабақ. Толық қолжетімділік алу үшін курсқа жазылыңыз!'
                    )}
                  </p>
                  <Button
                    className="w-full bg-purple-600 hover:bg-purple-700 rounded-xl mt-3"
                    onClick={() => setActiveSection?.('courses')}
                  >
                    {t('Посмотреть курсы', 'Курстарды қарау')}
                  </Button>
                </div>
              )}

              {!isDemoMode && lessons.length > 0 && (
                <div className="space-y-2 mt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('Уроки курса', 'Курс сабақтары')}</p>
                  {lessons.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => onSelectLesson?.(l.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl border-2 transition-all ${currentLesson?.id === l.id ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30' : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500'}`}
                    >
                      {l.order + 1}. {l.title}
                    </button>
                  ))}
                </div>
              )}

              {!isDemoMode && (
                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700 rounded-xl mt-4"
                  onClick={() => {
                    if (currentLesson && lessons.length) {
                      const idx = lessons.findIndex((l) => l.id === currentLesson.id);
                      if (idx >= 0 && idx < lessons.length - 1) {
                        onSelectLesson?.(lessons[idx + 1].id);
                      }
                    }
                  }}
                >
                  {t('Следующий урок', 'Келесі сабақ')}
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}