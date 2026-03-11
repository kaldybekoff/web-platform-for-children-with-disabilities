import { useState, useEffect } from 'react';
import { Video, FileText, Hand, Clock, X, Save } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useLanguage } from '../contexts/LanguageContext';
import { QuizEditor } from './QuizEditor';
import * as lessonsApi from '../api/lessons';
import type { LessonResponse } from '../api/types';

interface LessonEditorProps {
  lessonId: number;
  onClose: () => void;
  onSaved?: () => void;
}

export function LessonEditor({ lessonId, onClose, onSaved }: LessonEditorProps) {
  const { t } = useLanguage();
  const [lesson, setLesson] = useState<LessonResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [showQuizEditor, setShowQuizEditor] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [subtitleUrl, setSubtitleUrl] = useState('');
  const [hasSignLanguage, setHasSignLanguage] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState<number | ''>('');

  useEffect(() => {
    loadLesson();
  }, [lessonId]);

  const loadLesson = async () => {
    setLoading(true);
    try {
      const data = await lessonsApi.getLesson(lessonId);
      setLesson(data);
      setTitle(data.title);
      setContent(data.content);
      setVideoUrl(data.video_url || '');
      setSubtitleUrl(data.subtitle_url || '');
      setHasSignLanguage(data.has_sign_language);
      setDurationSeconds(data.duration_seconds || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const handleSave = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      await lessonsApi.updateLesson(lessonId, {
        title: title.trim(),
        content: content.trim(),
        video_url: videoUrl.trim() || null,
        subtitle_url: subtitleUrl.trim() || null,
        has_sign_language: hasSignLanguage,
        duration_seconds: durationSeconds ? Number(durationSeconds) : null,
      });
      showSuccess(t('Урок сохранен', 'Сабақ сақталды'));
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6 dark:bg-gray-800">
        <p className="text-purple-600 dark:text-purple-400">{t('Загрузка...', 'Жүктелуде...')}</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 dark:bg-gray-800 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">
          {t('Редактирование урока', 'Сабақты өңдеу')}
        </h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}
      {successMsg && <p className="text-green-600 dark:text-green-400 text-sm">{successMsg}</p>}

      <div className="space-y-4">
        {/* Basic info */}
        <div>
          <Label className="text-sm">{t('Название урока', 'Сабақ атауы')}</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-sm">{t('Описание/содержание', 'Сипаттама/мазмұны')}</Label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mt-1 w-full h-24 px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          />
        </div>

        {/* Video section */}
        <div className="border-t pt-4 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
            <Video className="w-4 h-4" />
            {t('Видео', 'Видео')}
          </h4>
          
          <div className="space-y-3">
            <div>
              <Label className="text-xs">{t('URL видео', 'Видео URL')}</Label>
              <Input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="mt-1"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t(
                  'Поддерживается: YouTube, Vimeo, или прямая ссылка на видео (.mp4, .webm)',
                  'Қолдау көрсетіледі: YouTube, Vimeo, немесе тікелей видео сілтемесі (.mp4, .webm)'
                )}
              </p>
            </div>

            <div>
              <Label className="text-xs">{t('URL субтитров (.vtt или .srt)', 'Субтитр URL')}</Label>
              <Input
                value={subtitleUrl}
                onChange={(e) => setSubtitleUrl(e.target.value)}
                placeholder="https://example.com/subtitles.vtt"
                className="mt-1"
              />
            </div>

            <div className="flex items-center gap-4">
              <div>
                <Label className="text-xs">{t('Длительность (сек)', 'Ұзақтығы (сек)')}</Label>
                <Input
                  type="number"
                  value={durationSeconds}
                  onChange={(e) => setDurationSeconds(e.target.value ? Number(e.target.value) : '')}
                  placeholder="300"
                  className="mt-1 w-24"
                />
              </div>

              <label className="flex items-center gap-2 mt-5">
                <input
                  type="checkbox"
                  checked={hasSignLanguage}
                  onChange={(e) => setHasSignLanguage(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm flex items-center gap-1">
                  <Hand className="w-4 h-4" />
                  {t('С жестовым переводом', 'Ым тілі аудармасымен')}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
            <Save className="w-4 h-4 mr-2" />
            {saving ? t('Сохранение...', 'Сақталуда...') : t('Сохранить урок', 'Сабақты сақтау')}
          </Button>
          <Button variant="outline" onClick={() => setShowQuizEditor(!showQuizEditor)}>
            {showQuizEditor ? t('Скрыть квиз', 'Тестті жасыру') : t('Редактировать квиз', 'Тестті өңдеу')}
          </Button>
        </div>
      </div>

      {/* Quiz editor */}
      {showQuizEditor && (
        <div className="border-t pt-4 dark:border-gray-700">
          <QuizEditor lessonId={lessonId} />
        </div>
      )}
    </Card>
  );
}
