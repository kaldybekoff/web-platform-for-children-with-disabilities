import { useEffect, useState } from 'react';
import { BookOpen, Plus, Edit, X, ChevronDown, ChevronRight, Settings, Trash2, Loader2, HelpCircle } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { LessonEditor } from './LessonEditor';
import * as coursesApi from '../api/courses';
import * as lessonsApi from '../api/lessons';
import type { CourseResponse, LessonResponse } from '../api/types';

interface TeacherCoursesProps {
  onOpenLesson: (courseId: number, lessonId: number) => void;
}

export function TeacherCourses({ onOpenLesson }: TeacherCoursesProps) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [lessonCounts, setLessonCounts] = useState<Record<number, number>>({});
  const [courseLessons, setCourseLessons] = useState<Record<number, LessonResponse[]>>({});
  const [expandedCourseId, setExpandedCourseId] = useState<number | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [addingLessonId, setAddingLessonId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingLessonId, setDeletingLessonId] = useState<number | null>(null);
  const [newLevel, setNewLevel] = useState<string>('beginner');

  const levelOptions = [
    { value: 'beginner', labelRu: 'Начальный', labelKz: 'Бастауыш' },
    { value: 'intermediate', labelRu: 'Средний', labelKz: 'Орташа' },
    { value: 'advanced', labelRu: 'Продвинутый', labelKz: 'Жоғары' },
  ];

  const getLevelLabel = (level: string) => {
    const option = levelOptions.find(o => o.value === level);
    return option ? t(option.labelRu, option.labelKz) : level;
  };

  const myCourses = courses.filter((c) => c.teacher_id === user?.id);

  useEffect(() => {
    coursesApi
      .listCourses()
      .then(async (list) => {
        setCourses(list);
        const lists = await Promise.all(list.map((c) => lessonsApi.listLessonsByCourse(c.id)));
        const counts: Record<number, number> = {};
        list.forEach((c, i) => {
          counts[c.id] = lists[i]?.length ?? 0;
        });
        setLessonCounts(counts);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Ошибка'))
      .finally(() => setLoading(false));
  }, []);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const loadCourses = () => {
    coursesApi.listCourses().then(async (list) => {
      setCourses(list);
      const lists = await Promise.all(list.map((c) => lessonsApi.listLessonsByCourse(c.id)));
      const counts: Record<number, number> = {};
      list.forEach((c, i) => {
        counts[c.id] = lists[i]?.length ?? 0;
      });
      setLessonCounts((prev) => ({ ...prev, ...counts }));
    });
  };

  const handleCreateCourse = async () => {
    if (!newTitle.trim() || saving) return;
    setSaving(true);
    try {
      await coursesApi.createCourse({ title: newTitle.trim(), description: newDesc.trim(), level: newLevel, image_url: newImageUrl.trim() || null });
      setNewTitle('');
      setNewDesc('');
      setNewLevel('beginner');
      setNewImageUrl('');
      setShowCreate(false);
      loadCourses();
      showSuccess(t('Курс создан', 'Курс жасалды'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async (id: number) => {
    if (!newTitle.trim() || saving) return;
    setSaving(true);
    try {
      await coursesApi.updateCourse(id, { title: newTitle.trim(), description: newDesc.trim(), level: newLevel, image_url: newImageUrl.trim() || null });
      setNewTitle('');
      setNewDesc('');
      setNewLevel('beginner');
      setNewImageUrl('');
      setEditingId(null);
      loadCourses();
      showSuccess(t('Изменения сохранены', 'Өзгерістер сақталды'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  const handleAddLesson = async (id: number) => {
    if (!newLessonTitle.trim() || saving) return;
    setSaving(true);
    try {
      const count = lessonCounts[id] ?? 0;
      await lessonsApi.createLesson({ course_id: id, title: newLessonTitle.trim(), content: '', order: count });
      setNewLessonTitle('');
      setAddingLessonId(null);
      setLessonCounts((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
      // Reload lessons for this course
      if (expandedCourseId === id) {
        loadCourseLessons(id);
      }
      showSuccess(t('Урок добавлен', 'Сабақ қосылды'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = async (courseId: number) => {
    const course = courses.find(c => c.id === courseId);
    const confirmMsg = t(
      `Удалить курс "${course?.title}"? Все уроки курса также будут удалены.`,
      `"${course?.title}" курсын жою керек пе? Барлық сабақтар да жойылады.`
    );
    if (!confirm(confirmMsg)) return;
    
    setDeletingId(courseId);
    try {
      await coursesApi.deleteCourse(courseId);
      loadCourses();
      showSuccess(t('Курс удален', 'Курс жойылды'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Ошибка удаления', 'Жою қатесі'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteLesson = async (lessonId: number, courseId: number) => {
    const lesson = courseLessons[courseId]?.find(l => l.id === lessonId);
    const confirmMsg = t(
      `Удалить урок "${lesson?.title}"?`,
      `"${lesson?.title}" сабағын жою керек пе?`
    );
    if (!confirm(confirmMsg)) return;
    
    setDeletingLessonId(lessonId);
    try {
      await lessonsApi.deleteLesson(lessonId);
      loadCourseLessons(courseId);
      setLessonCounts((prev) => ({ ...prev, [courseId]: Math.max(0, (prev[courseId] ?? 1) - 1) }));
      showSuccess(t('Урок удален', 'Сабақ жойылды'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Ошибка удаления', 'Жою қатесі'));
    } finally {
      setDeletingLessonId(null);
    }
  };

  const loadCourseLessons = async (courseId: number) => {
    try {
      const lessons = await lessonsApi.listLessonsByCourse(courseId);
      setCourseLessons((prev) => ({ ...prev, [courseId]: lessons }));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleExpandCourse = (courseId: number) => {
    if (expandedCourseId === courseId) {
      setExpandedCourseId(null);
    } else {
      setExpandedCourseId(courseId);
      if (!courseLessons[courseId]) {
        loadCourseLessons(courseId);
      }
    }
  };

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-purple-700 dark:text-purple-400 text-lg">{t('Мои курсы', 'Менің курстарым')}</h2>
            <p className="text-gray-600 dark:text-gray-400 text-xs">{t('Управление курсами и уроками', 'Курстар мен сабақтарды басқару')}</p>
          </div>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700 rounded-xl text-sm h-9 w-full sm:w-auto" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-1" />
          {t('Создать курс', 'Курс жасау')}
        </Button>
      </div>

      {successMsg && (
        <p className="text-sm text-green-600 dark:text-green-400 mb-3 rounded-lg bg-green-50 dark:bg-green-900/30 px-3 py-2">{successMsg}</p>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) { setShowCreate(false); setNewTitle(''); setNewDesc(''); setNewLevel('beginner'); setNewImageUrl(''); } }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-xl bg-gray-900 dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 bg-purple-600">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-white" />
                <h3 className="text-white font-medium">{t('Создать курс', 'Курс жасау')}</h3>
              </div>
              <button
                onClick={() => { setShowCreate(false); setNewTitle(''); setNewDesc(''); setNewLevel('beginner'); setNewImageUrl(''); }}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-6 flex flex-col gap-5">
              <div>
                <Label className="text-xs text-gray-400 mb-1 block">{t('Название', 'Атауы')}</Label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={t('Введите название курса', 'Курс атауын енгізіңіз')}
                  className="h-10 rounded-lg bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500 focus:border-purple-500"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-400 mb-1 block">{t('Описание', 'Сипаттама')}</Label>
                <Input
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder={t('Введите описание курса', 'Курс сипаттамасын енгізіңіз')}
                  className="h-10 rounded-lg bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500 focus:border-purple-500"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-400 mb-1 block">{t('Фото курса (URL)', 'Курс суреті (URL)')}</Label>
                <Input
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="h-10 rounded-lg bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500 focus:border-purple-500"
                />
                {newImageUrl.trim() && (
                  <img src={newImageUrl.trim()} alt="preview" className="mt-2 h-20 w-full object-cover rounded-lg" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                )}
              </div>
              <div>
                <Label className="text-xs text-gray-400 mb-1 block">{t('Уровень сложности', 'Қиындық деңгейі')}</Label>
                <select
                  value={newLevel}
                  onChange={(e) => setNewLevel(e.target.value)}
                  style={{ colorScheme: 'dark' }}
                  className="h-10 w-full rounded-lg border border-gray-700 bg-gray-800 text-gray-100 text-sm px-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {levelOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(option.labelRu, option.labelKz)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <Button
                  className="flex-1 h-10 bg-purple-600 hover:bg-purple-700 rounded-lg"
                  onClick={handleCreateCourse}
                  disabled={saving}
                >
                  {saving ? t('Создание...', 'Жасалуда...') : t('Создать курс', 'Курс жасау')}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 h-10 rounded-lg border-gray-600 text-gray-300 hover:bg-gray-800"
                  onClick={() => { setShowCreate(false); setNewTitle(''); setNewDesc(''); setNewLevel('beginner'); setNewImageUrl(''); }}
                >
                  {t('Отмена', 'Болдырмау')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && <p className="text-purple-600 dark:text-purple-400 text-sm">{t('Загрузка...', 'Жүктелуде...')}</p>}
      {error && <p className="text-red-600 dark:text-red-400 text-sm mb-2">{error}</p>}

      <div className="space-y-3">
        {myCourses.map((course) => (
          <div key={course.id}>
            {/* Course card */}
            <Card className="p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-100 dark:border-gray-700">
              {editingId === course.id ? (
                /* Inline edit form */
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('Редактирование курса', 'Курсты өңдеу')}</span>
                    <Button size="sm" variant="outline" className="rounded-lg h-7 text-xs dark:border-gray-600" onClick={() => { setEditingId(null); setNewTitle(''); setNewDesc(''); setNewLevel('beginner'); setNewImageUrl(''); }}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="h-9 text-sm dark:bg-gray-700 dark:border-gray-600" placeholder={t('Название', 'Атауы')} />
                  <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="h-9 text-sm dark:bg-gray-700 dark:border-gray-600" placeholder={t('Описание', 'Сипаттама')} />
                  <Input value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} className="h-9 text-sm dark:bg-gray-700 dark:border-gray-600" placeholder="https://example.com/image.jpg" />
                  <select
                    value={newLevel}
                    onChange={(e) => setNewLevel(e.target.value)}
                    style={{ colorScheme: 'dark' }}
                    className="h-9 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm px-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {levelOptions.map((option) => (
                      <option key={option.value} value={option.value}>{t(option.labelRu, option.labelKz)}</option>
                    ))}
                  </select>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" className="rounded-lg h-9 text-xs bg-green-600 hover:bg-green-700 flex-1" onClick={() => handleSaveEdit(course.id)} disabled={saving}>
                      {saving ? t('Сохранение...', 'Сақталуда...') : t('Сохранить', 'Сақтау')}
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-lg h-9 text-xs dark:border-gray-600" onClick={() => { setEditingId(null); setNewTitle(''); setNewDesc(''); setNewLevel('beginner'); setNewImageUrl(''); }}>
                      {t('Отмена', 'Болдырмау')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  {/* Course thumbnail */}
                  {course.image_url ? (
                    <img src={course.image_url} alt={course.title} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center shrink-0">
                      <BookOpen className="w-6 h-6 text-purple-500 dark:text-purple-400" />
                    </div>
                  )}

                  {/* Info + actions */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      {/* Left: title, meta, description */}
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{course.title}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {lessonCounts[course.id] ?? 0} {t('уроков', 'сабақ')} · {getLevelLabel(course.level)}
                        </p>
                        {course.description && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{course.description}</p>
                        )}
                      </div>

                      {/* Right: action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg h-8 text-xs dark:border-gray-600 dark:hover:bg-gray-700"
                          onClick={() => { setEditingId(course.id); setNewTitle(course.title); setNewDesc(course.description ?? ''); setNewLevel(course.level); setNewImageUrl(course.image_url ?? ''); }}
                        >
                          <Edit className="w-3 h-3 sm:mr-1" />
                          <span className="hidden sm:inline">{t('Редактировать', 'Өңдеу')}</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg h-8 text-xs dark:border-gray-600 dark:hover:bg-gray-700"
                          onClick={() => { setAddingLessonId(course.id); toggleExpandCourse(course.id); }}
                        >
                          <Plus className="w-3 h-3 sm:mr-1" />
                          <span className="hidden sm:inline">{t('Добавить урок', 'Сабақ қосу')}</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg h-8 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:border-gray-600"
                          onClick={() => handleDeleteCourse(course.id)}
                          disabled={deletingId === course.id}
                        >
                          {deletingId === course.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        </Button>
                      </div>
                    </div>

                    {/* Expand toggle */}
                    <button
                      onClick={() => toggleExpandCourse(course.id)}
                      className="mt-2.5 flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 transition-colors"
                    >
                      {expandedCourseId === course.id
                        ? <ChevronDown className="w-3.5 h-3.5" />
                        : <ChevronRight className="w-3.5 h-3.5" />}
                      {t('Уроки', 'Сабақтар')} ({lessonCounts[course.id] ?? 0})
                    </button>
                  </div>
                </div>
              )}
            </Card>

            {/* Lessons list */}
            {expandedCourseId === course.id && (
              <div className="mt-1.5 space-y-1 pl-2">
                {(courseLessons[course.id] || []).map((lesson) => (
                  <div key={lesson.id}>
                    {editingLessonId === lesson.id ? (
                      <LessonEditor
                        lessonId={lesson.id}
                        onClose={() => setEditingLessonId(null)}
                        onSaved={() => loadCourseLessons(course.id)}
                      />
                    ) : (
                      <div className="flex items-center justify-between gap-2 py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-600 transition-colors">
                        {/* Left: number + name + type */}
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className="w-6 h-6 rounded-md bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center text-xs font-bold shrink-0">
                            {lesson.order + 1}
                          </span>
                          <span className="text-sm text-gray-800 dark:text-gray-100 truncate font-medium">{lesson.title}</span>
                          {lesson.video_url && (
                            <span className="hidden sm:inline px-1.5 py-0.5 rounded text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 shrink-0">
                              {t('Видео', 'Видео')}
                            </span>
                          )}
                          {lesson.has_sign_language && (
                            <span className="hidden sm:inline px-1.5 py-0.5 rounded text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 shrink-0">
                              {t('Жестовый', 'Ым тілі')}
                            </span>
                          )}
                          {!lesson.video_url && !lesson.has_sign_language && (
                            <span className="hidden sm:inline px-1.5 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-600/60 text-gray-500 dark:text-gray-400 shrink-0">
                              {t('Текст', 'Мәтін')}
                            </span>
                          )}
                        </div>

                        {/* Right: Редактировать, Квиз, Удалить */}
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg h-7 text-xs dark:border-gray-500 dark:hover:bg-gray-600"
                            onClick={() => setEditingLessonId(lesson.id)}
                          >
                            <Settings className="w-3 h-3 sm:mr-1" />
                            <span className="hidden sm:inline">{t('Редактировать', 'Өңдеу')}</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg h-7 text-xs text-blue-600 dark:text-blue-400 dark:border-gray-500 dark:hover:bg-gray-600"
                            onClick={() => onOpenLesson(course.id, lesson.id)}
                          >
                            <HelpCircle className="w-3 h-3 sm:mr-1" />
                            <span className="hidden sm:inline">{t('Квиз', 'Квиз')}</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg h-7 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:border-gray-500"
                            onClick={() => handleDeleteLesson(lesson.id, course.id)}
                            disabled={deletingLessonId === lesson.id}
                          >
                            {deletingLessonId === lesson.id
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <Trash2 className="w-3 h-3" />}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {(courseLessons[course.id] || []).length === 0 && !addingLessonId && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 py-3 px-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                    {t('Уроков пока нет. Нажмите «Добавить урок».', 'Сабақтар жоқ. «Сабақ қосу» басыңыз.')}
                  </p>
                )}
              </div>
            )}

            {/* Add lesson inline form */}
            {addingLessonId === course.id && (
              <Card className="p-3 mt-1.5 ml-2 rounded-lg border border-purple-200 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-900/20">
                <div className="flex gap-2 items-center flex-wrap">
                  <Input value={newLessonTitle} onChange={(e) => setNewLessonTitle(e.target.value)} placeholder={t('Название урока', 'Сабақ атауы')} className="h-8 text-sm flex-1 min-w-[160px] dark:bg-gray-700 dark:border-gray-600" />
                  <Button size="sm" className="rounded-lg h-8 text-xs bg-purple-600 hover:bg-purple-700" onClick={() => handleAddLesson(course.id)} disabled={saving}>{t('Добавить', 'Қосу')}</Button>
                  <Button size="sm" variant="outline" className="rounded-lg h-8 text-xs dark:border-gray-600" onClick={() => { setAddingLessonId(null); setNewLessonTitle(''); }}><X className="w-3 h-3" /></Button>
                </div>
              </Card>
            )}
          </div>
        ))}
      </div>
      {!loading && myCourses.length === 0 && <p className="text-gray-600 dark:text-gray-400 text-sm">{t('У вас пока нет курсов', 'Сізде әзірше курс жоқ')}</p>}
    </section>
  );
}
