import { useEffect, useState } from 'react';
import { MessageCircle, Send, Loader2, Trash2, CornerDownRight, AlertCircle } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import * as commentsApi from '../api/comments';
import type { CommentResponse } from '../api/comments';

interface LessonCommentsProps {
  lessonId: number;
}

function timeAgo(iso: string, language: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return language === 'kz' ? 'жаңа ғана' : 'только что';
  if (diff < 3600) {
    const m = Math.floor(diff / 60);
    return language === 'kz' ? `${m} мин бұрын` : `${m} мин назад`;
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600);
    return language === 'kz' ? `${h} сағ бұрын` : `${h} ч назад`;
  }
  return new Date(iso).toLocaleDateString(language === 'kz' ? 'kk-KZ' : 'ru-RU', { day: 'numeric', month: 'short' });
}

interface CommentItemProps {
  comment: CommentResponse;
  currentUserId: number | undefined;
  currentUserRole: string | undefined;
  onReply: (parentId: number, authorName: string) => void;
  onDelete: (id: number) => void;
  language: string;
  t: (ru: string, kz: string) => string;
  depth?: number;
}

function CommentItem({ comment, currentUserId, currentUserRole, onReply, onDelete, language, t, depth = 0 }: CommentItemProps) {
  const isOwn = comment.user_id === currentUserId;
  const canDelete = isOwn || currentUserRole === 'admin';
  const isTeacher = comment.author_role === 'teacher' || comment.author_role === 'admin';

  return (
    <div className={depth > 0 ? 'ml-6 border-l-2 border-purple-100 dark:border-purple-900 pl-4' : ''}>
      <div className="flex items-start gap-3 py-3">
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-medium
          ${isTeacher ? 'bg-gradient-to-br from-purple-500 to-blue-500' : 'bg-gradient-to-br from-gray-400 to-gray-500'}`}>
          {comment.author_name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{comment.author_name}</span>
            {isTeacher && (
              <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">
                {comment.author_role === 'admin' ? t('Админ', 'Әкімші') : t('Учитель', 'Мұғалім')}
              </span>
            )}
            <span className="text-xs text-gray-400 dark:text-gray-500">{timeAgo(comment.created_at, language)}</span>
          </div>

          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">{comment.content}</p>

          <div className="flex items-center gap-3 mt-1.5">
            {depth === 0 && (
              <button
                onClick={() => onReply(comment.id, comment.author_name)}
                className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
              >
                <CornerDownRight className="w-3 h-3" />
                {t('Ответить', 'Жауап беру')}
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => onDelete(comment.id)}
                className="text-xs text-red-400 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                {t('Удалить', 'Жою')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      {comment.replies.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          onReply={onReply}
          onDelete={onDelete}
          language={language}
          t={t}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

export function LessonComments({ lessonId }: LessonCommentsProps) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: number; name: string } | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    commentsApi.listComments(lessonId)
      .then(setComments)
      .catch(() => setError(t('Ошибка загрузки комментариев', 'Пікірлерді жүктеу қатесі')))
      .finally(() => setLoading(false));
  }, [lessonId, isOpen]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      const created = await commentsApi.createComment(lessonId, text.trim(), replyTo?.id);
      if (replyTo) {
        setComments((prev) => prev.map((c) =>
          c.id === replyTo.id ? { ...c, replies: [...c.replies, created] } : c
        ));
      } else {
        setComments((prev) => [...prev, { ...created, replies: [] }]);
      }
      setText('');
      setReplyTo(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Ошибка отправки', 'Жіберу қатесі'));
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await commentsApi.deleteComment(id);
      setComments((prev) => prev
        .filter((c) => c.id !== id)
        .map((c) => ({ ...c, replies: c.replies.filter((r) => r.id !== id) }))
      );
    } catch {
      setError(t('Не удалось удалить', 'Жою мүмкін болмады'));
    }
  };

  const totalCount = comments.reduce((sum, c) => sum + 1 + c.replies.length, 0);

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
      {/* Header toggle */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/50 rounded-lg flex items-center justify-center shrink-0">
            <MessageCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
          <span className="font-medium text-gray-800 dark:text-gray-100 text-sm">
            {t('Вопросы и ответы', 'Сұрақтар мен жауаптар')}
          </span>
          {totalCount > 0 && (
            <span className="text-xs bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full">
              {totalCount}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          {/* Comments list */}
          <div className="px-4 max-h-96 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">
                {t('Вопросов пока нет. Задайте первый!', 'Әлі сұрақтар жоқ. Бірінші болыңыз!')}
              </p>
            ) : (
              comments.map((c) => (
                <CommentItem
                  key={c.id}
                  comment={c}
                  currentUserId={user?.id}
                  currentUserRole={user?.role}
                  onReply={(id, name) => { setReplyTo({ id, name }); }}
                  onDelete={handleDelete}
                  language={language}
                  t={t}
                />
              ))
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mx-4 mb-2 flex items-center gap-1 text-red-500 text-xs bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-3 space-y-2">
            {replyTo && (
              <div className="flex items-center justify-between bg-purple-50 dark:bg-purple-900/20 rounded-lg px-3 py-1.5">
                <span className="text-xs text-purple-700 dark:text-purple-300">
                  {t('Ответ', 'Жауап')}: {replyTo.name}
                </span>
                <button onClick={() => setReplyTo(null)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                  <span className="text-xs">✕</span>
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                placeholder={replyTo
                  ? t('Напишите ответ...', 'Жауабыңызды жазыңыз...')
                  : t('Задайте вопрос по уроку...', 'Сабақ бойынша сұрақ қойыңыз...')}
                rows={1}
                maxLength={1000}
                disabled={sending}
                className="flex-1 px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600
                           bg-gray-50 dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-100
                           placeholder-gray-400 focus:outline-none focus:border-purple-400
                           resize-none transition-colors disabled:opacity-50"
              />
              <Button
                onClick={handleSend}
                disabled={!text.trim() || sending}
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-3 h-auto"
              >
                {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
