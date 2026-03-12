import { useEffect, useState, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, ChevronRight, CheckCircle, XCircle, Hand } from 'lucide-react';
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

export function InteractiveLessonDemo({ courseId, lessonId, setActiveSection, onSelectLesson }: InteractiveLessonDemoProps) {
  const { t } = useLanguage();
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

  const title = currentLesson?.title || t('Демо урок: Приветствия на жестовом языке', 'Демо сабақ: Ым тіліндегі сәлемдесулер');
  const description = currentLesson?.content?.trim() || '';
  const videoType = getVideoType(currentLesson?.video_url);
  const embedUrl = videoType === 'youtube' 
    ? getYouTubeEmbedUrl(currentLesson?.video_url || '')
    : videoType === 'vimeo'
    ? getVimeoEmbedUrl(currentLesson?.video_url || '')
    : currentLesson?.video_url;

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
      <div className="mb-6">
        <h2 className="text-purple-700 dark:text-purple-400 mb-2">{title}</h2>
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
                  title={currentLesson?.title || 'Video'}
                />
              )}

              {/* Прямая ссылка на видео — используем video тег */}
              {videoType === 'direct' && currentLesson?.video_url && (
                <video
                  ref={videoRef}
                  src={currentLesson.video_url}
                  className="w-full h-full object-cover"
                  onTimeUpdate={handleVideoTimeUpdate}
                  onPlay={handleVideoPlay}
                  onPause={handleVideoPause}
                  onEnded={handleMarkComplete}
                  controls
                >
                  {currentLesson.subtitle_url && (
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
              {!currentLesson?.video_url && (
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

              {/* Контролы для прямого видео (не YouTube/Vimeo) */}
              {videoType === 'direct' && currentLesson?.video_url && !isPlaying && (
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
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
                  <div className="text-3xl mb-2">👋</div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{t('Привет', 'Сәлем')}</p>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                  <div className="text-3xl mb-2">🙏</div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{t('Спасибо', 'Рахмет')}</p>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-xl">
                  <div className="text-3xl mb-2">👋</div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{t('Пока', 'Сау бол')}</p>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Боковая панель с заданиями */}
        <div className="space-y-4">
          {/* Quiz section */}
          {currentLesson && (
            <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-800 dark:text-gray-100">
                  {t('Тест к уроку', 'Сабаққа тест')}
                </h3>
                {!showQuiz && (
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

              {showQuiz ? (
                <QuizPlayer
                  lessonId={currentLesson.id}
                  onComplete={handleQuizComplete}
                />
              ) : (
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
              {t('Прогресс урока', 'Сабақ үлгерімі')}
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
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
              </div>

              {!lessonProgress?.completed && (
                <Button
                  onClick={handleMarkComplete}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  {t('Отметить урок завершенным', 'Сабақты аяқталған деп белгілеу')}
                </Button>
              )}

              {lessons.length > 0 && (
                <div className="space-y-2 mt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('Уроки курса', 'Курс сабақтары')}</p>
                  {lessons.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => onSelectLesson?.(l.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl border-2 transition-all ${currentLesson?.id === l.id ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30' : 'border-gray-200 dark:border-gray-600 hover:border-purple-300'}`}
                    >
                      {l.order + 1}. {l.title}
                    </button>
                  ))}
                </div>
              )}

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
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}