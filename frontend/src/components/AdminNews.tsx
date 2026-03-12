import { useEffect, useState } from 'react';
import { Newspaper, Plus, Edit, Trash2, Eye, EyeOff, Video, Image } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useLanguage } from '../contexts/LanguageContext';
import * as newsApi from '../api/news';
import type { NewsResponse } from '../api/types';

export function AdminNews() {
  const { t, language } = useLanguage();
  const [news, setNews] = useState<NewsResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [saving, setSaving] = useState(false);

  // Form state
  const [titleRu, setTitleRu] = useState('');
  const [titleKz, setTitleKz] = useState('');
  const [contentRu, setContentRu] = useState('');
  const [contentKz, setContentKz] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = () => {
    setLoading(true);
    newsApi.listAllNewsAdmin({ limit: 50 })
      .then((data) => setNews(data.news))
      .catch((err) => setError(err instanceof Error ? err.message : 'Ошибка'))
      .finally(() => setLoading(false));
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const resetForm = () => {
    setTitleRu('');
    setTitleKz('');
    setContentRu('');
    setContentKz('');
    setVideoUrl('');
    setImageUrl('');
    setIsPublished(true);
    setShowCreate(false);
    setEditingId(null);
  };

  const handleCreate = async () => {
    if (!titleRu.trim() || !contentRu.trim() || saving) return;
    setSaving(true);
    try {
      await newsApi.createNews({
        title_ru: titleRu.trim(),
        title_kz: titleKz.trim(),
        content_ru: contentRu.trim(),
        content_kz: contentKz.trim(),
        video_url: videoUrl.trim() || null,
        image_url: imageUrl.trim() || null,
        is_published: isPublished,
      });
      resetForm();
      loadNews();
      showSuccess(t('Новость добавлена', 'Жаңалық қосылды'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item: NewsResponse) => {
    setEditingId(item.id);
    setTitleRu(item.title_ru);
    setTitleKz(item.title_kz);
    setContentRu(item.content_ru);
    setContentKz(item.content_kz);
    setVideoUrl(item.video_url || '');
    setImageUrl(item.image_url || '');
    setIsPublished(item.is_published);
  };

  const saveEdit = async () => {
    if (editingId == null || saving) return;
    setSaving(true);
    try {
      await newsApi.updateNews(editingId, {
        title_ru: titleRu.trim(),
        title_kz: titleKz.trim(),
        content_ru: contentRu.trim(),
        content_kz: contentKz.trim(),
        video_url: videoUrl.trim() || null,
        image_url: imageUrl.trim() || null,
        is_published: isPublished,
      });
      resetForm();
      loadNews();
      showSuccess(t('Изменения сохранены', 'Өзгерістер сақталды'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('Удалить новость?', 'Жаңалықты өшіру керек пе?'))) return;
    try {
      await newsApi.deleteNews(id);
      loadNews();
      showSuccess(t('Новость удалена', 'Жаңалық өшірілді'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(language === 'kz' ? 'kk-KZ' : 'ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-xl flex items-center justify-center flex-shrink-0">
            <Newspaper className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-purple-700 dark:text-purple-400 text-lg">{t('Новости', 'Жаңалықтар')}</h2>
            <p className="text-gray-600 dark:text-gray-400 text-xs truncate">{t('Управление новостями платформы', 'Платформа жаңалықтарын басқару')}</p>
          </div>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700 rounded-xl text-sm h-9 text-white flex-shrink-0" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 sm:mr-1" />
          <span className="hidden sm:inline">{t('Добавить новость', 'Жаңалық қосу')}</span>
        </Button>
      </div>

      {successMsg && (
        <p className="text-sm text-green-600 dark:text-green-400 mb-3 rounded-lg bg-green-50 dark:bg-green-900/30 px-3 py-2">{successMsg}</p>
      )}
      {error && <p className="text-sm text-red-600 dark:text-red-400 mb-2">{error}</p>}

      {/* Create/Edit form */}
      {(showCreate || editingId != null) && (
        <Card className="p-4 mb-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-purple-200 dark:border-purple-700">
          <h3 className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-3">
            {editingId ? t('Редактировать новость', 'Жаңалықты өңдеу') : t('Новая новость', 'Жаңа жаңалық')}
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">{t('Заголовок (RU)', 'Тақырып (RU)')}</Label>
              <Input value={titleRu} onChange={(e) => setTitleRu(e.target.value)} placeholder={t('Заголовок на русском', 'Орысша тақырып')} className="mt-1 h-9 rounded-lg dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div>
              <Label className="text-xs">{t('Заголовок (KZ)', 'Тақырып (KZ)')}</Label>
              <Input value={titleKz} onChange={(e) => setTitleKz(e.target.value)} placeholder={t('Заголовок на казахском', 'Қазақша тақырып')} className="mt-1 h-9 rounded-lg dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div>
              <Label className="text-xs">{t('Текст (RU)', 'Мәтін (RU)')}</Label>
              <textarea
                value={contentRu}
                onChange={(e) => setContentRu(e.target.value)}
                placeholder={t('Текст новости на русском', 'Орысша жаңалық мәтіні')}
                className="mt-1 w-full h-24 px-3 py-2 border rounded-lg text-sm bg-white border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
            <div>
              <Label className="text-xs">{t('Текст (KZ)', 'Мәтін (KZ)')}</Label>
              <textarea
                value={contentKz}
                onChange={(e) => setContentKz(e.target.value)}
                placeholder={t('Текст новости на казахском', 'Қазақша жаңалық мәтіні')}
                className="mt-1 w-full h-24 px-3 py-2 border rounded-lg text-sm bg-white border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
          </div>
          {/* Media fields */}
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div>
              <Label className="text-xs flex items-center gap-1">
                <Video className="w-3 h-3" />
                {t('Ссылка на видео (YouTube)', 'Видео сілтемесі (YouTube)')}
              </Label>
              <Input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="mt-1 h-9 rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1">
                <Image className="w-3 h-3" />
                {t('Ссылка на изображение', 'Сурет сілтемесі')}
              </Label>
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="mt-1 h-9 rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>

          {/* Image preview */}
          {imageUrl && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('Превью изображения:', 'Сурет алдын ала қарау:')}</p>
              <img
                src={imageUrl}
                alt="Preview"
                className="max-h-32 rounded-lg border border-gray-200 dark:border-gray-600 object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          )}

          <div className="flex items-center gap-4 mt-3">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              {t('Опубликовано', 'Жарияланған')}
            </label>
          </div>
          <div className="flex gap-2 mt-3">
            <Button size="sm" className="rounded-lg h-9 bg-purple-600 hover:bg-purple-700 text-white" onClick={editingId ? saveEdit : handleCreate} disabled={saving}>
              {saving ? t('Сохранение...', 'Сақтау...') : editingId ? t('Сохранить', 'Сақтау') : t('Добавить', 'Қосу')}
            </Button>
            <Button size="sm" variant="outline" className="rounded-lg h-9 dark:border-gray-600 dark:hover:bg-gray-700" onClick={resetForm}>
              {t('Отмена', 'Болдырмау')}
            </Button>
          </div>
        </Card>
      )}

      {loading && <p className="text-purple-600 dark:text-purple-400 text-sm">{t('Загрузка...', 'Жүктелуде...')}</p>}

      {/* News list */}
      <div className="space-y-3">
        {news.map((item) => (
          <Card key={item.id} className="p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-100 dark:border-gray-700">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-gray-800 dark:text-gray-100 text-sm font-medium">
                    {language === 'kz' && item.title_kz ? item.title_kz : item.title_ru}
                  </h3>
                  {item.video_url && (
                    <span className="text-xs text-blue-600 dark:text-blue-400" title={t('Есть видео', 'Видео бар')}>
                      <Video className="w-3 h-3" />
                    </span>
                  )}
                  {item.image_url && (
                    <span className="text-xs text-purple-600 dark:text-purple-400" title={t('Есть изображение', 'Сурет бар')}>
                      <Image className="w-3 h-3" />
                    </span>
                  )}
                  {item.is_published ? (
                    <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                      <EyeOff className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  {language === 'kz' && item.content_kz ? item.content_kz : item.content_ru}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{formatDate(item.created_at)}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="outline" size="sm" className="rounded-lg h-8 w-8 p-0 dark:border-gray-600 dark:hover:bg-gray-700" onClick={() => startEdit(item)}>
                  <Edit className="w-3 h-3" />
                </Button>
                <Button variant="outline" size="sm" className="rounded-lg h-8 w-8 p-0 text-red-600 hover:text-red-700 dark:border-gray-600 dark:hover:bg-gray-700" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      {!loading && news.length === 0 && <p className="text-gray-500 dark:text-gray-400 text-sm mt-4">{t('Новостей пока нет', 'Жаңалықтар әлі жоқ')}</p>}
    </section>
  );
}
