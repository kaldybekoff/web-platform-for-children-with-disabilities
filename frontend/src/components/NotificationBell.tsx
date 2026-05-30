import { useEffect, useRef, useState } from 'react';
import { Bell, BookOpen, MessageCircle, Check, CheckCheck, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import * as notificationsApi from '../api/notifications';
import * as lessonsApi from '../api/lessons';
import type { NotificationItem } from '../api/notifications';

interface NotificationBellProps {
  onOpenLesson: (courseId: number, lessonId: number) => void;
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'только что';
  if (diff < 3600) return `${Math.floor(diff / 60)} мин`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч`;
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function NotifIcon({ type }: { type: string }) {
  if (type === 'comment_reply')
    return <MessageCircle className="w-4 h-4 text-orange-500 dark:text-orange-300" />;
  return <BookOpen className="w-4 h-4 text-purple-500 dark:text-purple-300" />;
}

export function NotificationBell({ onOpenLesson }: NotificationBellProps) {
  const { t } = useLanguage();
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Poll unread count every 30s
  useEffect(() => {
    const fetchCount = () => {
      notificationsApi.getUnreadCount()
        .then((r) => setUnread(r.count))
        .catch(() => {});
    };
    fetchCount();
    const timer = setInterval(fetchCount, 30_000);
    return () => clearInterval(timer);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = async () => {
    if (open) { setOpen(false); return; }
    setOpen(true);
    setLoading(true);
    try {
      const data = await notificationsApi.getNotifications({ limit: 20 });
      setItems(data.notifications);
      setUnread(data.unread_count);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = async (item: NotificationItem) => {
    if (!item.is_read) {
      await notificationsApi.markRead(item.id).catch(() => {});
      setItems((prev) => prev.map((n) => n.id === item.id ? { ...n, is_read: true } : n));
      setUnread((c) => Math.max(0, c - 1));
    }
    if (item.lesson_id) {
      // Resolve course_id from lesson, then navigate
      try {
        const lesson = await lessonsApi.getLesson(item.lesson_id);
        onOpenLesson(lesson.course_id, lesson.id);
      } catch {
        onOpenLesson(0, item.lesson_id);
      }
      setOpen(false);
    }
  };

  const handleMarkAll = async () => {
    await notificationsApi.markAllRead().catch(() => {});
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnread(0);
  };

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={handleOpen}
        title={t('Уведомления', 'Хабарландырулар')}
        className="relative rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center
                   border-2 border-gray-200 dark:border-gray-600
                   hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 dark:text-gray-300" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white
                           text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] w-80 sm:w-96 bg-white dark:bg-gray-800
                        rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
              {t('Уведомления', 'Хабарландырулар')}
              {unread > 0 && (
                <span className="ml-2 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full">
                  {unread}
                </span>
              )}
            </span>
            {unread > 0 && (
              <button
                onClick={handleMarkAll}
                className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 hover:underline"
              >
                <CheckCheck className="w-3 h-3" />
                {t('Прочитать все', 'Барлығын оқу')}
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center px-4">
                <Bell className="w-10 h-10 text-gray-200 dark:text-gray-600 mb-2" />
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  {t('Уведомлений пока нет', 'Хабарландырулар әлі жоқ')}
                </p>
              </div>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleClick(item)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors
                    hover:bg-gray-100 dark:hover:bg-gray-700/50
                    ${!item.is_read ? 'bg-purple-50 dark:bg-purple-900/10' : 'bg-white dark:bg-transparent'}`}
                >
                  {/* Icon */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5
                    ${!item.is_read
                      ? 'bg-purple-100 dark:bg-purple-900/40'
                      : 'bg-gray-100 dark:bg-gray-700'}`}>
                    <NotifIcon type={item.type} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug mb-0.5 ${!item.is_read
                      ? 'font-medium text-gray-900 dark:text-gray-100'
                      : 'text-gray-700 dark:text-gray-300'}`}>
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                      {item.body}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                      {timeAgo(item.created_at)}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!item.is_read && (
                    <div className="w-2 h-2 rounded-full bg-purple-500 shrink-0 mt-2" />
                  )}
                  {item.is_read && (
                    <Check className="w-3 h-3 text-gray-300 dark:text-gray-600 shrink-0 mt-2" />
                  )}
                </button>
              ))
            )}
          </div>

          {items.length > 0 && (
            <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-2 text-center">
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {t(`Показано ${items.length}`, `${items.length} көрсетілді`)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
