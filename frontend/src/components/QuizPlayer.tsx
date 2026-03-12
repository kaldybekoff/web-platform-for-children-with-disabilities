import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Trophy, RefreshCw } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { useLanguage } from '../contexts/LanguageContext';
import * as quizzesApi from '../api/quizzes';
import type { QuizResponseStudent, QuizResultResponse } from '../api/types';

interface CheckedQuestion {
  isCorrect: boolean;
  correctAnswerId: number;
}

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
  
  // New states for check flow
  const [checkedQuestions, setCheckedQuestions] = useState<Record<number, CheckedQuestion>>({});
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    loadQuiz();
  }, [lessonId]);

  const loadQuiz = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setSelectedAnswers({});
    setCheckedQuestions({});
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
    // Don't allow changing answer after checking
    if (checkedQuestions[questionId]) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answerId,
    }));
  };

  const handleCheckAnswer = async () => {
    if (!quiz) return;
    const question = quiz.questions[currentQuestion];
    const selectedAnswerId = selectedAnswers[question.id];
    if (!selectedAnswerId || checkedQuestions[question.id]) return;
    
    setChecking(true);
    try {
      const res = await quizzesApi.checkAnswer(question.id, selectedAnswerId);
      setCheckedQuestions((prev) => ({
        ...prev,
        [question.id]: {
          isCorrect: res.is_correct,
          correctAnswerId: res.correct_answer_id,
        },
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка проверки');
    } finally {
      setChecking(false);
    }
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
      <Card className="p-6 bg-white dark:bg-gray-800">
        <p className="text-purple-600 dark:text-purple-400">{t('Загрузка теста...', 'Тест жүктелуде...')}</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 bg-white dark:bg-gray-800">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </Card>
    );
  }

  if (!quiz || quiz.questions.length === 0) {
    return (
      <Card className="p-6 bg-white dark:bg-gray-800">
        <p className="text-gray-600 dark:text-gray-400">
          {t('Для этого урока нет теста', 'Бұл сабаққа тест жоқ')}
        </p>
      </Card>
    );
  }

  // Show result
  if (result) {
    return (
      <Card className="p-6 bg-white dark:bg-gray-800">
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
  const checkedAll = quiz.questions.every((q) => checkedQuestions[q.id] !== undefined);
  const isCurrentChecked = checkedQuestions[question.id] !== undefined;
  const currentCheckedData = checkedQuestions[question.id];
  const hasSelectedAnswer = selectedAnswers[question.id] !== undefined;
  const isLastQuestion = currentQuestion === quiz.questions.length - 1;

  return (
    <Card className="p-6 bg-white dark:bg-gray-800 space-y-4">
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
            const isCorrectAnswer = currentCheckedData?.correctAnswerId === answer.id;
            const isWrongSelected = isCurrentChecked && isSelected && !currentCheckedData?.isCorrect;
            
            let buttonClasses = 'w-full p-4 rounded-xl border-2 transition-all text-left ';
            let circleClasses = 'w-5 h-5 rounded-full border-2 flex items-center justify-center ';
            
            if (isCurrentChecked) {
              // After checking - show results
              if (isCorrectAnswer) {
                buttonClasses += 'border-green-500 bg-green-50 dark:bg-green-900/30';
                circleClasses += 'border-green-500 bg-green-500';
              } else if (isWrongSelected) {
                buttonClasses += 'border-red-500 bg-red-50 dark:bg-red-900/30';
                circleClasses += 'border-red-500 bg-red-500';
              } else {
                buttonClasses += 'border-gray-300 dark:border-gray-600 opacity-60';
                circleClasses += 'border-gray-400 dark:border-gray-500';
              }
            } else {
              // Before checking - selection mode
              if (isSelected) {
                buttonClasses += 'border-purple-500 bg-purple-50 dark:bg-purple-900/30';
                circleClasses += 'border-purple-500 bg-purple-500';
              } else {
                buttonClasses += 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500';
                circleClasses += 'border-gray-400 dark:border-gray-500';
              }
            }
            
            return (
              <button
                key={answer.id}
                onClick={() => handleSelectAnswer(question.id, answer.id)}
                disabled={isCurrentChecked}
                className={buttonClasses}
              >
                <div className="flex items-center gap-3">
                  <div className={circleClasses}>
                    {isCurrentChecked && isCorrectAnswer && (
                      <CheckCircle className="w-3 h-3 text-white" />
                    )}
                    {isWrongSelected && (
                      <XCircle className="w-3 h-3 text-white" />
                    )}
                    {!isCurrentChecked && isSelected && (
                      <CheckCircle className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 flex-1">
                    {language === 'kz' && answer.text_kz ? answer.text_kz : answer.text_ru}
                  </span>
                  {isCurrentChecked && isCorrectAnswer && (
                    <span className="text-green-600 dark:text-green-400 text-sm">
                      {t('Правильно', 'Дұрыс')}
                    </span>
                  )}
                  {isWrongSelected && (
                    <span className="text-red-600 dark:text-red-400 text-sm">
                      {t('Неправильно', 'Қате')}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Check result message */}
        {isCurrentChecked && (
          <div className={`mt-4 p-3 rounded-lg ${
            currentCheckedData?.isCorrect 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
          }`}>
            {currentCheckedData?.isCorrect 
              ? t('✓ Правильный ответ!', '✓ Дұрыс жауап!')
              : t('✗ Неправильный ответ', '✗ Қате жауап')}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
          disabled={currentQuestion === 0}
          className="w-full sm:w-auto"
        >
          {t('Назад', 'Артқа')}
        </Button>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* Check button - shown when answer selected but not yet checked */}
          {!isCurrentChecked && (
            <Button
              onClick={handleCheckAnswer}
              disabled={!hasSelectedAnswer || checking}
              className="bg-purple-600 hover:bg-purple-700 text-white disabled:bg-purple-400 disabled:text-white/80 w-full sm:w-auto"
            >
              {checking ? t('Проверка...', 'Тексерілуде...') : t('Проверить', 'Тексеру')}
            </Button>
          )}

          {/* Next/Finish button - shown only after checking */}
          {isCurrentChecked && (
            <>
              {!isLastQuestion ? (
                <Button
                  onClick={() => setCurrentQuestion((prev) => prev + 1)}
                  className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto"
                >
                  {t('Далее', 'Келесі')}
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!checkedAll || submitting}
                  className="bg-green-500 hover:bg-green-600 text-white disabled:bg-green-300 disabled:text-white/80 w-full sm:w-auto"
                >
                  {submitting ? t('Отправка...', 'Жіберілуде...') : t('Завершить тест', 'Тестті аяқтау')}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Question dots */}
      <div className="flex flex-wrap gap-2 justify-center pt-2">
        {quiz.questions.map((q, i) => {
          const qChecked = checkedQuestions[q.id];
          let dotClasses = 'w-8 h-8 rounded-full text-xs font-medium transition-all ';
          
          if (i === currentQuestion) {
            dotClasses += 'bg-purple-600 text-white';
          } else if (qChecked) {
            if (qChecked.isCorrect) {
              dotClasses += 'bg-green-500 text-white';
            } else {
              dotClasses += 'bg-red-500 text-white';
            }
          } else if (selectedAnswers[q.id] !== undefined) {
            dotClasses += 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-700';
          } else {
            dotClasses += 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-400';
          }
          
          return (
            <button
              key={q.id}
              onClick={() => setCurrentQuestion(i)}
              className={dotClasses}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
