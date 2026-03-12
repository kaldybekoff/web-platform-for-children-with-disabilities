import { useEffect, useState } from 'react';
import { BookOpen, Plus, Edit, X, ChevronDown, ChevronRight, Settings } from 'lucide-react';
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

export function TeacherCourses() {
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
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [saving, setSaving] = useState(false);

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
      await coursesApi.createCourse({ title: newTitle.trim(), description: newDesc.trim(), level: 'beginner' });
      setNewTitle('');
      setNewDesc('');
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
      await coursesApi.updateCourse(id, { title: newTitle.trim(), description: newDesc.trim() });
      setNewTitle('');
      setNewDesc('');
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
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-purple-700 dark:text-purple-400 text-lg">{t('Мои курсы', 'Менің курстарым')}</h2>
            <p className="text-gray-600 dark:text-gray-400 text-xs">{t('Управление курсами и уроками', 'Курстар мен сабақтарды басқару')}</p>
          </div>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700 rounded-xl text-sm h-9" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-1" />
          {t('Создать курс', 'Курс жасау')}
        </Button>
      </div>

      {successMsg && (
        <p className="text-sm text-green-600 dark:text-green-400 mb-3 rounded-lg bg-green-50 dark:bg-green-900/30 px-3 py-2">{successMsg}</p>
      )}

      {showCreate && (
        <Card className="p-4 mb-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-purple-200 dark:border-purple-700">
          <h3 className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-3">{t('Новый курс', 'Жаңа курс')}</h3>
          <div className="flex flex-col gap-2">
            <div>
              <Label className="text-xs">{t('Название', 'Атауы')}</Label>
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder={t('Название курса', 'Курс атауы')} className="mt-1 h-9 rounded-lg dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div>
              <Label className="text-xs">{t('Описание', 'Сипаттама')}</Label>
              <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder={t('Описание', 'Сипаттама')} className="mt-1 h-9 rounded-lg dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="rounded-lg h-9 bg-purple-600 hover:bg-purple-700" onClick={handleCreateCourse} disabled={saving}>{t('Создать', 'Жасау')}</Button>
              <Button size="sm" variant="outline" className="rounded-lg h-9 dark:border-gray-600 dark:hover:bg-gray-700" onClick={() => { setShowCreate(false); setNewTitle(''); setNewDesc(''); }}>{t('Отмена', 'Болдырмау')}</Button>
            </div>
          </div>
        </Card>
      )}

      {loading && <p className="text-purple-600 dark:text-purple-400 text-sm">{t('Загрузка...', 'Жүктелуде...')}</p>}
      {error && <p className="text-red-600 dark:text-red-400 text-sm mb-2">{error}</p>}

      <div className="space-y-3">
        {myCourses.map((course) => (
          <div key={course.id}>
            <Card className="p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleExpandCourse(course.id)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                    {expandedCourseId === course.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  <div>
                    {editingId === course.id ? (
                      <div className="flex gap-2 items-center flex-wrap">
                        <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="h-8 text-sm w-48 dark:bg-gray-700 dark:border-gray-600" placeholder={t('Название', 'Атауы')} />
                        <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="h-8 text-sm w-48 dark:bg-gray-700 dark:border-gray-600" placeholder={t('Описание', 'Сипаттама')} />
                        <Button size="sm" className="rounded-lg h-8 text-xs bg-green-600 hover:bg-green-700" onClick={() => handleSaveEdit(course.id)} disabled={saving}>{t('Сохранить', 'Сақтау')}</Button>
                        <Button size="sm" variant="outline" className="rounded-lg h-8 text-xs dark:border-gray-600" onClick={() => { setEditingId(null); setNewTitle(''); setNewDesc(''); }}><X className="w-3 h-3" /></Button>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-gray-800 dark:text-gray-100 text-sm font-medium">{course.title}</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{lessonCounts[course.id] ?? 0} {t('уроков', 'сабақ')}</p>
                        {course.description && <p className="text-xs text-gray-500 dark:text-gray-500">{course.description}</p>}
                      </>
                    )}
                  </div>
                </div>
                {editingId !== course.id && (
                  <div className="flex gap-1.5 shrink-0">
                    <Button variant="outline" size="sm" className="rounded-lg h-8 text-xs dark:border-gray-600 dark:hover:bg-gray-700" onClick={() => { setEditingId(course.id); setNewTitle(course.title); setNewDesc(course.description ?? ''); }}>
                      <Edit className="w-3 h-3 mr-1" />
                      {t('Редактировать', 'Өңдеу')}
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-lg h-8 text-xs dark:border-gray-600 dark:hover:bg-gray-700" onClick={() => setAddingLessonId(course.id)}>
                      {t('Добавить урок', 'Сабақ қосу')}
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* Expanded lessons list - left aligned */}
            {expandedCourseId === course.id && (
              <div className="mt-2 space-y-2">
                {(courseLessons[course.id] || []).map((lesson) => (
                  <div key={lesson.id}>
                    {editingLessonId === lesson.id ? (
                      <LessonEditor
                        lessonId={lesson.id}
                        onClose={() => setEditingLessonId(null)}
                        onSaved={() => loadCourseLessons(course.id)}
                      />
                    ) : (
                      <Card className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border flex items-center justify-start gap-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400 w-6 shrink-0">{lesson.order + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 dark:text-gray-100 truncate">{lesson.title}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            {lesson.video_url && <span className="text-green-600">📹 {t('Видео', 'Видео')}</span>}
                            {lesson.has_sign_language && <span className="text-purple-600">🤟 {t('Жестовый', 'Ым тілі')}</span>}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg h-7 text-xs shrink-0"
                          onClick={() => setEditingLessonId(lesson.id)}
                        >
                          <Settings className="w-3 h-3 mr-1" />
                          {t('Настроить', 'Баптау')}
                        </Button>
                      </Card>
                    )}
                  </div>
                ))}
                {(courseLessons[course.id] || []).length === 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 py-2">
                    {t('Нет уроков', 'Сабақтар жоқ')}
                  </p>
                )}
              </div>
            )}

            {addingLessonId === course.id && (
              <Card className="p-3 mt-2 rounded-lg border border-purple-200 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-900/20">
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
