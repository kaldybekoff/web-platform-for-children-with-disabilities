import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Trophy, RefreshCw } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { useLanguage } from '../contexts/LanguageContext';
import * as quizzesApi from '../api/quizzes';
import type { QuizResponseStudent, QuizResultResponse } from '../api/types';

interface QuizPlayerProps {
  lessonId: number;
  onComplete?: (passed: boolean, score: number) => void;
}

export function QuizPlayer({ lessonId, onComplete }: QuizPlayerProps) {
  const { t, language } = useLanguage();
  const [quiz, setQuiz] = useState<QuizResponseStudent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResultResponse | null>(null);

  useEffect(() => {
    loadQuiz();
  }, [lessonId]);

  const loadQuiz = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setSelectedAnswers({});
    setCurrentQuestion(0);
    try {
      const data = await quizzesApi.getQuiz(lessonId);
      setQuiz(data as QuizResponseStudent);
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

  const handleSelectAnswer = (questionId: number, answerId: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answerId,
    }));
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    setSubmitting(true);
    try {
      const res = await quizzesApi.submitQuiz(quiz.id, selectedAnswers);
      setResult(res);
      onComplete?.(res.passed, res.score);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка отправки');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    loadQuiz();
  };

  if (loading) {
    return (
      <Card className="p-6 dark:bg-gray-800">
        <p className="text-purple-600 dark:text-purple-400">{t('Загрузка теста...', 'Тест жүктелуде...')}</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 dark:bg-gray-800">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </Card>
    );
  }

  if (!quiz || quiz.questions.length === 0) {
    return (
      <Card className="p-6 dark:bg-gray-800">
        <p className="text-gray-600 dark:text-gray-400">
          {t('Для этого урока нет теста', 'Бұл сабаққа тест жоқ')}
        </p>
      </Card>
    );
  }

  // Show result
  if (result) {
    return (
      <Card className="p-6 dark:bg-gray-800">
        <div className="text-center space-y-4">
          {result.passed ? (
            <>
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                <Trophy className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-medium text-green-600 dark:text-green-400">
                {t('Тест пройден!', 'Тест өтілді!')}
              </h3>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-medium text-red-600 dark:text-red-400">
                {t('Тест не пройден', 'Тест өтілмеді')}
              </h3>
            </>
          )}

          <div className="text-4xl font-bold text-gray-800 dark:text-gray-100">
            {result.score}%
          </div>

          <p className="text-gray-600 dark:text-gray-400">
            {t('Правильных ответов:', 'Дұрыс жауаптар:')} {result.correct_answers} / {result.total_questions}
          </p>

          <p className="text-sm text-gray-500 dark:text-gray-500">
            {t('Для прохождения нужно:', 'Өту үшін қажет:')} {quiz.passing_score}%
          </p>

          <Button onClick={handleRetry} variant="outline" className="mt-4">
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('Пройти заново', 'Қайта өту')}
          </Button>
        </div>
      </Card>
    );
  }

  const question = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;
  const answeredAll = quiz.questions.every((q) => selectedAnswers[q.id] !== undefined);

  return (
    <Card className="p-6 dark:bg-gray-800 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">
          {quiz.title || t('Тест', 'Тест')}
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {currentQuestion + 1} / {quiz.questions.length}
        </span>
      </div>

      <Progress value={progress} className="h-2" />

      {/* Current question */}
      <div className="py-4">
        <p className="text-gray-800 dark:text-gray-100 font-medium mb-4">
          {language === 'kz' && question.text_kz ? question.text_kz : question.text_ru}
        </p>

        <div className="space-y-2">
          {question.answers.map((answer) => {
            const isSelected = selectedAnswers[question.id] === answer.id;
            return (
              <button
                key={answer.id}
                onClick={() => handleSelectAnswer(question.id, answer.id)}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  isSelected
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                    : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected
                        ? 'border-purple-500 bg-purple-500'
                        : 'border-gray-300 dark:border-gray-500'
                    }`}
                  >
                    {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">
                    {language === 'kz' && answer.text_kz ? answer.text_kz : answer.text_ru}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t dark:border-gray-700">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
          disabled={currentQuestion === 0}
        >
          {t('Назад', 'Артқа')}
        </Button>

        {currentQuestion < quiz.questions.length - 1 ? (
          <Button
            onClick={() => setCurrentQuestion((prev) => prev + 1)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {t('Далее', 'Келесі')}
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!answeredAll || submitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {submitting ? t('Отправка...', 'Жіберілуде...') : t('Завершить тест', 'Тестті аяқтау')}
          </Button>
        )}
      </div>

      {/* Question dots */}
      <div className="flex flex-wrap gap-2 justify-center pt-2">
        {quiz.questions.map((q, i) => (
          <button
            key={q.id}
            onClick={() => setCurrentQuestion(i)}
            className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
              i === currentQuestion
                ? 'bg-purple-600 text-white'
                : selectedAnswers[q.id] !== undefined
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border border-green-300 dark:border-green-700'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </Card>
  );
}
