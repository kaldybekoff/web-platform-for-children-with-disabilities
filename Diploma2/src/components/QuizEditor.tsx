import { useState, useEffect } from 'react';
import { Plus, Trash2, Check, X, GripVertical } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useLanguage } from '../contexts/LanguageContext';
import * as quizzesApi from '../api/quizzes';
import type { QuizResponse, QuestionResponse, AnswerResponse } from '../api/types';

interface QuizEditorProps {
  lessonId: number;
  onClose?: () => void;
}

export function QuizEditor({ lessonId, onClose }: QuizEditorProps) {
  const { t } = useLanguage();
  const [quiz, setQuiz] = useState<QuizResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  // New question form
  const [newQuestionRu, setNewQuestionRu] = useState('');
  const [newQuestionKz, setNewQuestionKz] = useState('');
  const [showAddQuestion, setShowAddQuestion] = useState(false);

  // New answer form (per question)
  const [addingAnswerToQuestion, setAddingAnswerToQuestion] = useState<number | null>(null);
  const [newAnswerRu, setNewAnswerRu] = useState('');
  const [newAnswerKz, setNewAnswerKz] = useState('');
  const [newAnswerCorrect, setNewAnswerCorrect] = useState(false);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  useEffect(() => {
    loadQuiz();
  }, [lessonId]);

  const loadQuiz = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await quizzesApi.getQuiz(lessonId);
      setQuiz(data as QuizResponse);
    } catch (err: any) {
      if (err?.message?.includes('404') || err?.message?.includes('not found')) {
        setQuiz(null);
      } else {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuiz = async () => {
    setSaving(true);
    try {
      const newQuiz = await quizzesApi.createQuiz(lessonId, {
        title: t('Тест к уроку', 'Сабаққа тест'),
        passing_score: 70,
      });
      setQuiz(newQuiz);
      showSuccess(t('Квиз создан', 'Тест жасалды'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  const handleAddQuestion = async () => {
    if (!quiz || !newQuestionRu.trim()) return;
    setSaving(true);
    try {
      const question = await quizzesApi.createQuestion(quiz.id, {
        text_ru: newQuestionRu.trim(),
        text_kz: newQuestionKz.trim(),
        order: quiz.questions.length,
      });
      setQuiz({
        ...quiz,
        questions: [...quiz.questions, question],
      });
      setNewQuestionRu('');
      setNewQuestionKz('');
      setShowAddQuestion(false);
      showSuccess(t('Вопрос добавлен', 'Сұрақ қосылды'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (!quiz) return;
    setSaving(true);
    try {
      await quizzesApi.deleteQuestion(questionId);
      setQuiz({
        ...quiz,
        questions: quiz.questions.filter((q) => q.id !== questionId),
      });
      showSuccess(t('Вопрос удален', 'Сұрақ жойылды'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAnswer = async (questionId: number) => {
    if (!quiz || !newAnswerRu.trim()) return;
    setSaving(true);
    try {
      const answer = await quizzesApi.createAnswer(questionId, {
        text_ru: newAnswerRu.trim(),
        text_kz: newAnswerKz.trim(),
        is_correct: newAnswerCorrect,
        order: quiz.questions.find((q) => q.id === questionId)?.answers.length || 0,
      });
      setQuiz({
        ...quiz,
        questions: quiz.questions.map((q) =>
          q.id === questionId ? { ...q, answers: [...q.answers, answer] } : q
        ),
      });
      setNewAnswerRu('');
      setNewAnswerKz('');
      setNewAnswerCorrect(false);
      setAddingAnswerToQuestion(null);
      showSuccess(t('Ответ добавлен', 'Жауап қосылды'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCorrect = async (questionId: number, answerId: number, currentCorrect: boolean) => {
    if (!quiz) return;
    setSaving(true);
    try {
      await quizzesApi.updateAnswer(answerId, { is_correct: !currentCorrect });
      setQuiz({
        ...quiz,
        questions: quiz.questions.map((q) =>
          q.id === questionId
            ? {
                ...q,
                answers: q.answers.map((a) =>
                  a.id === answerId ? { ...a, is_correct: !currentCorrect } : a
                ),
              }
            : q
        ),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAnswer = async (questionId: number, answerId: number) => {
    if (!quiz) return;
    setSaving(true);
    try {
      await quizzesApi.deleteAnswer(answerId);
      setQuiz({
        ...quiz,
        questions: quiz.questions.map((q) =>
          q.id === questionId
            ? { ...q, answers: q.answers.filter((a) => a.id !== answerId) }
            : q
        ),
      });
      showSuccess(t('Ответ удален', 'Жауап жойылды'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
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

  if (!quiz) {
    return (
      <Card className="p-6 dark:bg-gray-800">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {t('У этого урока пока нет квиза', 'Бұл сабақта әлі тест жоқ')}
          </p>
          <Button
            onClick={handleCreateQuiz}
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('Создать квиз', 'Тест жасау')}
          </Button>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose} className="mt-4 w-full">
            {t('Закрыть', 'Жабу')}
          </Button>
        )}
      </Card>
    );
  }

  return (
    <Card className="p-6 dark:bg-gray-800 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">
          {t('Редактор квиза', 'Тест редакторы')}
        </h3>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}
      {successMsg && <p className="text-green-600 dark:text-green-400 text-sm">{successMsg}</p>}

      <div className="text-sm text-gray-600 dark:text-gray-400">
        {t('Проходной балл:', 'Өту балы:')} {quiz.passing_score}%
      </div>

      {/* Questions list */}
      <div className="space-y-4">
        {quiz.questions.map((question, qIndex) => (
          <Card key={question.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 border">
            <div className="flex items-start gap-2 mb-3">
              <span className="text-purple-600 dark:text-purple-400 font-medium">
                {qIndex + 1}.
              </span>
              <div className="flex-1">
                <p className="text-gray-800 dark:text-gray-100">{question.text_ru}</p>
                {question.text_kz && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{question.text_kz}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteQuestion(question.id)}
                disabled={saving}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Answers */}
            <div className="ml-6 space-y-2">
              {question.answers.map((answer) => (
                <div
                  key={answer.id}
                  className={`flex items-center gap-2 p-2 rounded-lg border ${
                    answer.is_correct
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <button
                    onClick={() => handleToggleCorrect(question.id, answer.id, answer.is_correct)}
                    disabled={saving}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      answer.is_correct
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-gray-300 dark:border-gray-500'
                    }`}
                  >
                    {answer.is_correct && <Check className="w-3 h-3" />}
                  </button>
                  <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                    {answer.text_ru}
                    {answer.text_kz && ` / ${answer.text_kz}`}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteAnswer(question.id, answer.id)}
                    disabled={saving}
                    className="text-red-500 hover:text-red-600 p-1 h-auto"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}

              {/* Add answer form */}
              {addingAnswerToQuestion === question.id ? (
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-700 space-y-2">
                  <Input
                    value={newAnswerRu}
                    onChange={(e) => setNewAnswerRu(e.target.value)}
                    placeholder={t('Текст ответа (рус)', 'Жауап мәтіні (орыс)')}
                    className="h-8 text-sm"
                  />
                  <Input
                    value={newAnswerKz}
                    onChange={(e) => setNewAnswerKz(e.target.value)}
                    placeholder={t('Текст ответа (каз)', 'Жауап мәтіні (қаз)')}
                    className="h-8 text-sm"
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={newAnswerCorrect}
                      onChange={(e) => setNewAnswerCorrect(e.target.checked)}
                      className="rounded"
                    />
                    {t('Правильный ответ', 'Дұрыс жауап')}
                  </label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAddAnswer(question.id)}
                      disabled={saving || !newAnswerRu.trim()}
                      className="h-7 text-xs bg-purple-600 hover:bg-purple-700"
                    >
                      {t('Добавить', 'Қосу')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setAddingAnswerToQuestion(null);
                        setNewAnswerRu('');
                        setNewAnswerKz('');
                        setNewAnswerCorrect(false);
                      }}
                      className="h-7 text-xs"
                    >
                      {t('Отмена', 'Болдырмау')}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddingAnswerToQuestion(question.id)}
                  className="text-xs h-7"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {t('Добавить ответ', 'Жауап қосу')}
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Add question form */}
      {showAddQuestion ? (
        <Card className="p-4 border-2 border-purple-200 dark:border-purple-700 space-y-3">
          <h4 className="text-sm font-medium text-gray-800 dark:text-gray-100">
            {t('Новый вопрос', 'Жаңа сұрақ')}
          </h4>
          <div>
            <Label className="text-xs">{t('Текст вопроса (рус)', 'Сұрақ мәтіні (орыс)')}</Label>
            <Input
              value={newQuestionRu}
              onChange={(e) => setNewQuestionRu(e.target.value)}
              className="mt-1"
              placeholder={t('Введите вопрос...', 'Сұрақты енгізіңіз...')}
            />
          </div>
          <div>
            <Label className="text-xs">{t('Текст вопроса (каз)', 'Сұрақ мәтіні (қаз)')}</Label>
            <Input
              value={newQuestionKz}
              onChange={(e) => setNewQuestionKz(e.target.value)}
              className="mt-1"
              placeholder={t('Сұрақты енгізіңіз...', 'Сұрақты енгізіңіз...')}
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleAddQuestion}
              disabled={saving || !newQuestionRu.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {t('Добавить вопрос', 'Сұрақ қосу')}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddQuestion(false);
                setNewQuestionRu('');
                setNewQuestionKz('');
              }}
            >
              {t('Отмена', 'Болдырмау')}
            </Button>
          </div>
        </Card>
      ) : (
        <Button
          variant="outline"
          onClick={() => setShowAddQuestion(true)}
          className="w-full border-dashed"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('Добавить вопрос', 'Сұрақ қосу')}
        </Button>
      )}
    </Card>
  );
}
