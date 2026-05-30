import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Loader2, Sparkles, ChevronDown, ChevronUp, AlertCircle, User } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { useLanguage } from '../contexts/LanguageContext';
import { sendAIMessage } from '../api/ai';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
}

interface QuickAction {
  labelRu: string;
  labelKz: string;
  promptRu: string;
  promptKz: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    labelRu: 'Краткое резюме',
    labelKz: 'Қысқаша қорытынды',
    promptRu: 'Дай краткое резюме этого урока в 3–5 предложениях.',
    promptKz: 'Осы сабақтың қысқаша қорытындысын 3–5 сөйлеммен бер.',
  },
  {
    labelRu: 'Объясни проще',
    labelKz: 'Қарапайымырақ түсіндір',
    promptRu: 'Объясни тему урока максимально простым языком, как будто я слышу её первый раз.',
    promptKz: 'Сабақ тақырыбын мүмкіндігінше қарапайым тілмен түсіндір, санаулы рет естіп отырғандай.',
  },
  {
    labelRu: 'Вопросы для практики',
    labelKz: 'Жаттығу сұрақтары',
    promptRu: 'Придумай 3 вопроса для самопроверки по теме этого урока.',
    promptKz: 'Осы сабақ тақырыбы бойынша өзін-өзі тексеруге арналған 3 сұрақ ойлап шығар.',
  },
  {
    labelRu: 'Примеры из жизни',
    labelKz: 'Өмірден мысалдар',
    promptRu: 'Приведи 2–3 реальных примера из повседневной жизни по теме этого урока.',
    promptKz: 'Осы сабақ тақырыбына байланысты күнделікті өмірден 2–3 нақты мысал кел.',
  },
];

interface LessonAIAssistantProps {
  lessonTitle: string;
  lessonContent: string;
}

export function LessonAIAssistant({ lessonTitle, lessonContent }: LessonAIAssistantProps) {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const lessonContext = `Название урока: ${lessonTitle}\n\nОписание урока:\n${lessonContent}`;

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    setError(null);
    setIsOpen(true);

    const userMsg: Message = { id: Date.now(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      const response = await sendAIMessage(text, lessonContext);
      const assistantMsg: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.reply,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Ошибка. Попробуйте снова.', 'Қате. Қайта көріңіз.'));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    const prompt = language === 'kz' ? action.promptKz : action.promptRu;
    sendMessage(prompt);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-medium text-gray-800 dark:text-gray-100 text-sm">
            {t('AI Помощник по уроку', 'Сабақ бойынша AI Көмекші')}
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {/* Quick action buttons — always visible */}
      <div className="px-4 pb-3 grid grid-cols-2 gap-2">
        {QUICK_ACTIONS.map((action, i) => (
          <button
            key={i}
            onClick={() => handleQuickAction(action)}
            disabled={loading}
            className="text-xs px-3 py-2 rounded-lg border-2 border-purple-200 dark:border-purple-700
                       text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30
                       transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {language === 'kz' ? action.labelKz : action.labelRu}
          </button>
        ))}
      </div>

      {/* Expandable chat area */}
      {isOpen && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          {/* Messages */}
          <div className="h-64 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Bot className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {t('Нажмите кнопку выше или задайте вопрос', 'Жоғарыдағы батырманы басыңыз немесе сұрақ қойыңыз')}
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-purple-500 to-blue-500'
                      : 'bg-gradient-to-br from-emerald-500 to-teal-500'
                  }`}>
                    {msg.role === 'user'
                      ? <User className="w-3 h-3 text-white" />
                      : <Bot className="w-3 h-3 text-white" />}
                  </div>
                  <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs whitespace-pre-wrap break-words ${
                    msg.role === 'user'
                      ? 'bg-purple-500 text-white rounded-tr-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))
            )}

            {loading && (
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shrink-0">
                  <Bot className="w-3 h-3 text-white" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-xl rounded-tl-sm px-3 py-2 flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin text-purple-500" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">{t('AI думает...', 'AI ойлануда...')}</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {error && (
            <div className="px-3 pb-2">
              <div className="flex items-center gap-1 text-red-500 text-xs bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-3">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('Задайте вопрос...', 'Сұрақ қойыңыз...')}
                className="flex-1 px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600
                           bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-xs
                           placeholder-gray-400 focus:outline-none focus:border-purple-400
                           resize-none transition-colors"
                rows={1}
                maxLength={500}
                disabled={loading}
              />
              <Button
                type="submit"
                disabled={!inputValue.trim() || loading}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-3 h-auto"
              >
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              </Button>
            </form>
          </div>
        </div>
      )}
    </Card>
  );
}
