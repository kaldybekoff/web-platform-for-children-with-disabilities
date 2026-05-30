import { useEffect, useState } from 'react';
import { Newspaper, Calendar, Play, ChevronLeft, ChevronRight, ExternalLink, Search } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import * as newsApi from '../api/news';
import type { NewsResponse } from '../api/types';

const PAGE_SIZE = 6;

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([^?&]+)/);
  return match ? match[1] : null;
}

export function NewsPage() {
  const { t, language } = useLanguage();
  const [news, setNews] = useState<NewsResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedVideo, setExpandedVideo] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const totalPages = Math.ceil(total / PAGE_SIZE);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      setExpandedVideo(null);
      newsApi.listNews({ limit: PAGE_SIZE, offset: page * PAGE_SIZE, search: searchQuery })
        .then((data) => { setNews(data.news); setTotal(data.total); })
        .catch(console.error)
        .finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(timer);
  }, [page, searchQuery]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(language === 'kz' ? 'kk-KZ' : 'ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Заголовок */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-xl flex items-center justify-center">
          <Newspaper className="w-5 h-5 text-orange-600 dark:text-orange-400" />
        </div>
        <h1 className="text-2xl font-bold text-purple-700 dark:text-purple-400">
          {t('Новости', 'Жаңалықтар')}
        </h1>
        {total > 0 && (
          <span className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
            {t(`Всего: ${total}`, `Барлығы: ${total}`)}
          </span>
        )}
      </div>

      {/* Поиск */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
          placeholder={t('Поиск по новостям...', 'Жаңалықтарды іздеу...')}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600
                     bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm
                     placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-colors"
        />
      </div>

      {/* Список новостей */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-100 dark:border-gray-700 animate-pulse">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
            </div>
          ))}
        </div>
      ) : news.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 border-2 border-gray-100 dark:border-gray-700 text-center">
          <Newspaper className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            {t('Новостей пока нет', 'Жаңалықтар әлі жоқ')}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {news.map((item) => {
            const rawMediaUrl = item.media_url || item.video_url || item.image_url || null;
            let mediaType: 'youtube' | 'image' | null = item.media_type;
            let youtubeId: string | null = null;

            if (rawMediaUrl && !mediaType) {
              const id = getYouTubeId(rawMediaUrl);
              mediaType = id ? 'youtube' : 'image';
              youtubeId = id;
            } else if (rawMediaUrl && mediaType === 'youtube') {
              youtubeId = getYouTubeId(rawMediaUrl);
            }

            const isVideoExpanded = mediaType === 'youtube' && youtubeId && expandedVideo === item.id;
            const title = language === 'kz' && item.title_kz ? item.title_kz : item.title_ru;
            const content = language === 'kz' && item.content_kz ? item.content_kz : item.content_ru;

            return (
              <article
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 overflow-hidden"
              >
                {/* Картинка вверху */}
                {mediaType === 'image' && rawMediaUrl && (
                  <div className="w-full max-h-72 overflow-hidden">
                    <img
                      src={rawMediaUrl}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
                    />
                  </div>
                )}

                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
                    {title}
                  </h2>

                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4 whitespace-pre-line">
                    {content}
                  </p>

                  {/* YouTube */}
                  {mediaType === 'youtube' && youtubeId && (
                    <div className="mb-4">
                      {isVideoExpanded ? (
                        <div className="aspect-video rounded-xl overflow-hidden">
                          <iframe
                            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <button
                          onClick={() => setExpandedVideo(item.id)}
                          className="relative w-full aspect-video rounded-xl overflow-hidden group"
                        >
                          <img
                            src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                            <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                              <Play className="w-6 h-6 text-purple-600 ml-1" fill="currentColor" />
                            </div>
                          </div>
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 text-xs">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDate(item.created_at)}</span>
                    </div>

                    {/* Кнопка "Читать источник" — когда media_url есть, но это не картинка и не YouTube */}
                    {rawMediaUrl && !mediaType && (
                      <a
                        href={rawMediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        {t('Читать источник', 'Дереккөзді оқу')}
                      </a>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 0}
            className="w-9 h-9 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:border-purple-400 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`w-9 h-9 rounded-xl border-2 text-sm font-medium transition-colors ${
                i === page
                  ? 'bg-purple-500 border-purple-500 text-white'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-purple-400'
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages - 1}
            className="w-9 h-9 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:border-purple-400 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
