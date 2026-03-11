import { useEffect, useState } from 'react';
import { BookOpen, Plus, Edit, X } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useLanguage } from '../contexts/LanguageContext';
import * as coursesApi from '../api/courses';
import * as lessonsApi from '../api/lessons';
import type { CourseResponse } from '../api/types';

export function AdminCourses() {
  const { t } = useLanguage();
  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [lessonCounts, setLessonCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [saving, setSaving] = useState(false);

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

  const handleCreate = async () => {
    if (!newTitle.trim() || saving) return;
    setSaving(true);
    try {
      await coursesApi.createCourse({ title: newTitle.trim(), description: newDesc.trim(), level: 'beginner' });
      setNewTitle('');
      setNewDesc('');
      setShowCreate(false);
      loadCourses();
      showSuccess(t('Курс добавлен', 'Курс қосылды'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (c: CourseResponse) => {
    setEditingId(c.id);
    setEditTitle(c.title);
    setEditDesc(c.description ?? '');
  };

  const saveEdit = async () => {
    if (editingId == null || saving) return;
    setSaving(true);
    try {
      await coursesApi.updateCourse(editingId, { title: editTitle.trim(), description: editDesc.trim() });
      setEditingId(null);
      loadCourses();
      showSuccess(t('Изменения сохранены', 'Өзгерістер сақталды'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="text-purple-700 dark:text-purple-400 text-lg">{t('Курсы платформы', 'Платформа курстары')}</h2>
            <p className="text-gray-600 dark:text-gray-400 text-xs">{t('Управление всеми курсами', 'Барлық курстарды басқару')}</p>
          </div>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700 rounded-xl text-sm h-9" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-1" />
          {t('Добавить курс', 'Курс қосу')}
        </Button>
      </div>

      {successMsg && (
        <p className="text-sm text-green-600 dark:text-green-400 mb-3 rounded-lg bg-green-50 dark:bg-green-900/30 px-3 py-2">{successMsg}</p>
      )}
      {error && <p className="text-sm text-red-600 dark:text-red-400 mb-2">{error}</p>}

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
              <Button size="sm" className="rounded-lg h-9 bg-purple-600 hover:bg-purple-700" onClick={handleCreate} disabled={saving}>{t('Добавить', 'Қосу')}</Button>
              <Button size="sm" variant="outline" className="rounded-lg h-9 dark:border-gray-600 dark:hover:bg-gray-700" onClick={() => { setShowCreate(false); setNewTitle(''); setNewDesc(''); }}>{t('Отмена', 'Болдырмау')}</Button>
            </div>
          </div>
        </Card>
      )}

      {loading && <p className="text-purple-600 dark:text-purple-400 text-sm">{t('Загрузка...', 'Жүктелуде...')}</p>}

      <div className="space-y-3">
        {courses.map((c) => (
          <Card key={c.id} className="p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              {editingId === c.id ? (
                <div className="flex flex-wrap gap-3 items-center">
                  <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="h-8 text-sm w-48 dark:bg-gray-700 dark:border-gray-600" placeholder={t('Название', 'Атауы')} />
                  <Input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="h-8 text-sm w-48 dark:bg-gray-700 dark:border-gray-600" placeholder={t('Описание', 'Сипаттама')} />
                  <Button size="sm" className="rounded-lg h-8 text-xs bg-green-600 hover:bg-green-700" onClick={saveEdit} disabled={saving}>{t('Сохранить', 'Сақтау')}</Button>
                  <Button size="sm" variant="outline" className="rounded-lg h-8 text-xs dark:border-gray-600" onClick={() => setEditingId(null)}><X className="w-3 h-3" /></Button>
                </div>
              ) : (
                <>
                  <h3 className="text-gray-800 dark:text-gray-100 text-sm font-medium">{c.title}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{lessonCounts[c.id] ?? 0} {t('уроков', 'сабақ')} · {c.level}</p>
                  {c.description && <p className="text-xs text-gray-500 dark:text-gray-500">{c.description}</p>}
                </>
              )}
            </div>
            {editingId !== c.id && (
              <Button variant="outline" size="sm" className="rounded-lg h-8 text-xs shrink-0 dark:border-gray-600 dark:hover:bg-gray-700" onClick={() => startEdit(c)}>
                <Edit className="w-3 h-3 mr-1" />
                {t('Редактировать', 'Өңдеу')}
              </Button>
            )}
          </Card>
        ))}
      </div>
      {!loading && courses.length === 0 && <p className="text-gray-500 dark:text-gray-400 text-sm mt-4">{t('Курсов пока нет', 'Курстар әзірше жоқ')}</p>}
    </section>
  );
}
