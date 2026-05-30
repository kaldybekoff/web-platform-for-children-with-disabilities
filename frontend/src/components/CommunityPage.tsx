import { useState, useEffect } from 'react';
import { Users, Heart, Send, Trash2, Loader2, Trophy, BookOpen, GraduationCap } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import * as communityApi from '../api/community';
import * as meApi from '../api/me';
import type { SuccessPostResponse, StudyFriendResponse } from '../api/types';

export function CommunityPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [posts, setPosts] = useState<SuccessPostResponse[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studyFriends, setStudyFriends] = useState<StudyFriendResponse[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(true);

  const isStudent = user?.role === 'student';

  useEffect(() => {
    loadPosts();
    if (isStudent) {
      loadStudyFriends();
    } else {
      setFriendsLoading(false);
    }
  }, [isStudent]);

  const loadPosts = async () => {
    try {
      const data = await communityApi.listSuccessPosts({ limit: 50 });
      setPosts(data.posts);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Ошибка загрузки', 'Жүктеу қатесі'));
    } finally {
      setLoading(false);
    }
  };

  const loadStudyFriends = async () => {
    try {
      const data = await meApi.getStudyFriends();
      setStudyFriends(data.friends);
    } catch {
      // Silently fail for study friends
    } finally {
      setFriendsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || submitting) return;

    setSubmitting(true);
    try {
      const newPost = await communityApi.createSuccessPost({ content: newPostContent.trim() });
      setPosts([newPost, ...posts]);
      setNewPostContent('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Ошибка создания', 'Жасау қатесі'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (postId: number) => {
    try {
      const updated = await communityApi.likePost(postId);
      setPosts(posts.map(p => p.id === postId ? updated : p));
    } catch {
      // Silently fail for likes
    }
  };

  const handleDelete = async (postId: number) => {
    try {
      await communityApi.deleteSuccessPost(postId);
      setPosts(posts.filter(p => p.id !== postId));
    } catch {
      // Silently fail for deletes
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleBadge = (role: string) => {
    const roleLabels: Record<string, { ru: string; kz: string; color: string }> = {
      student: { ru: 'Студент', kz: 'Студент', color: 'bg-blue-500' },
      teacher: { ru: 'Учитель', kz: 'Мұғалім', color: 'bg-green-500' },
      admin: { ru: 'Админ', kz: 'Админ', color: 'bg-purple-500' },
    };
    const info = roleLabels[role] || { ru: role, kz: role, color: 'bg-gray-500' };
    return { label: t(info.ru, info.kz), color: info.color };
  };

  return (
    <section className="container mx-auto px-4 py-12">
      {/* Study Friends Section - only for students */}
      {isStudent && (
      <div className="mb-16">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-2xl mb-4">
            <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-400 mb-2">
            {t('Учебные друзья', 'Оқу достары')}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
            {t(
              'Студенты, которые учатся на тех же курсах, что и вы',
              'Сізбен бірге оқитын студенттер'
            )}
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {friendsLoading ? (
            <div className="text-center py-10">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 dark:text-blue-400" />
            </div>
          ) : studyFriends.length === 0 ? (
            <Card className="p-8 text-center bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700">
              <GraduationCap className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-500 dark:text-gray-400">
                {t(
                  'Пока нет учебных друзей. Запишитесь на курсы, чтобы найти единомышленников!',
                  'Әзірше оқу достары жоқ. Пікірлестерді табу үшін курстарға жазылыңыз!'
                )}
              </p>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {studyFriends.map((friend) => {
                const displayName = [friend.first_name, friend.last_name].filter(Boolean).join(' ') || friend.email;
                const roleBadge = getRoleBadge(friend.role);
                return (
                  <Card
                    key={friend.id}
                    className="p-5 bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all hover:shadow-lg"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white font-medium text-lg shrink-0">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">
                          {displayName}
                        </p>
                        <Badge className={`${roleBadge.color} text-white border-0 text-xs mt-1`}>
                          {roleBadge.label}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <BookOpen className="w-4 h-4 text-blue-500" />
                      <span>
                        {friend.common_courses_count}{' '}
                        {t(
                          friend.common_courses_count === 1 ? 'общий курс' : 'общих курса',
                          friend.common_courses_count === 1 ? 'ортақ курс' : 'ортақ курс'
                        )}
                      </span>
                    </div>

                    {friend.common_courses.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {friend.common_courses.slice(0, 3).map((course, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full truncate max-w-full"
                            title={course}
                          >
                            {course.length > 20 ? course.slice(0, 20) + '...' : course}
                          </span>
                        ))}
                        {friend.common_courses.length > 3 && (
                          <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                            +{friend.common_courses.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
      )}

      {/* Success Wall Section */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-2xl mb-4">
          <Trophy className="w-8 h-8 text-purple-600 dark:text-purple-400" />
        </div>
        <h2 className="text-2xl font-bold text-purple-700 dark:text-purple-400 mb-2">
          {t('Стена успехов', 'Жетістіктер қабырғасы')}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
          {t(
            'Делитесь своими достижениями и поддерживайте других учеников!',
            'Жетістіктеріңізбен бөлісіңіз және басқа оқушыларды қолдаңыз!'
          )}
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Create Post Form */}
        <Card className="p-5 bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700">
          <form onSubmit={handleSubmit}>
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder={t(
                'Расскажите о своем успехе... 🎉',
                'Жетістігіңіз туралы айтыңыз... 🎉'
              )}
              className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 
                         bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100
                         placeholder-gray-400 dark:placeholder-gray-500
                         focus:outline-none focus:border-purple-400 dark:focus:border-purple-500
                         resize-none transition-colors"
              rows={3}
              maxLength={500}
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {newPostContent.length}/500
              </span>
              <Button
                type="submit"
                disabled={!newPostContent.trim() || submitting}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-5"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {t('Опубликовать', 'Жариялау')}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>

        {/* Error */}
        {error && (
          <div className="text-center text-red-500 text-sm py-2">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="text-center py-10">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-500" />
          </div>
        ) : posts.length === 0 ? (
          <Card className="p-8 text-center bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-500 dark:text-gray-400">
              {t(
                'Пока нет постов. Будьте первым!',
                'Әзірше посттар жоқ. Бірінші болыңыз!'
              )}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card
                key={post.id}
                className="p-5 bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-medium text-sm shrink-0">
                      {post.author_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800 dark:text-gray-100 truncate">
                        {post.author_name}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {formatDate(post.created_at)}
                      </p>
                    </div>
                  </div>
                  {user?.id === post.user_id && (
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      title={t('Удалить', 'Жою')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <p className="mt-3 text-gray-700 dark:text-gray-200 whitespace-pre-wrap break-words">
                  {post.content}
                </p>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all border ${
                      post.liked_by_me
                        ? 'bg-pink-100 dark:bg-pink-800/50 text-pink-600 dark:text-pink-300 border-pink-300 dark:border-pink-600 shadow-sm'
                        : 'bg-gray-50 dark:bg-gray-600 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-500 hover:bg-pink-50 dark:hover:bg-pink-900/40 hover:text-pink-600 dark:hover:text-pink-300 hover:border-pink-300 dark:hover:border-pink-500'
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${post.liked_by_me ? 'fill-current text-pink-500 dark:text-pink-400' : ''}`}
                    />
                    <span>{post.likes_count}</span>
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
