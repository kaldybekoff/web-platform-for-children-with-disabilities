import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { useLanguage } from '../contexts/LanguageContext';
import { sendAIMessage } from '../api/ai';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function AIChat() {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || loading) return;

    setError(null);

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: trimmedInput,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const response = await sendAIMessage(trimmedInput);
      
      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('Ошибка отправки сообщения', 'Хабарлама жіберу қатесі')
      );
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <section className="container mx-auto px-4 py-8 sm:py-12">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl mb-4 shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-purple-700 dark:text-purple-400 mb-2">
            {t('AI Помощник', 'AI Көмекші')}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
            {t(
              'Задавайте вопросы по учёбе — AI поможет разобраться!',
              'Оқу бойынша сұрақтар қойыңыз — AI түсінуге көмектеседі!'
            )}
          </p>
        </div>

        {/* Chat Container */}
        <Card className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 overflow-hidden">
          {/* Messages Area */}
          <div className="h-[400px] sm:h-[500px] overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Bot className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-2">
                  {t('Начните диалог с AI помощником', 'AI көмекшісімен диалогты бастаңыз')}
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 max-w-sm">
                  {t(
                    'Спросите о любой теме, и AI поможет вам разобраться',
                    'Кез келген тақырып туралы сұраңыз, AI түсінуге көмектеседі'
                  )}
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 ${
                    message.role === 'user' ? 'flex-row-reverse' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-purple-500 to-blue-500'
                        : 'bg-gradient-to-br from-emerald-500 to-teal-500'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <User className="w-5 h-5 text-white" />
                    ) : (
                      <Bot className="w-5 h-5 text-white" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[80%] sm:max-w-[75%] ${
                      message.role === 'user'
                        ? 'bg-purple-500 text-white rounded-2xl rounded-tr-md'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-2xl rounded-tl-md'
                    } px-4 py-3`}
                  >
                    <p className="whitespace-pre-wrap break-words text-sm sm:text-base">
                      {message.content}
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        message.role === 'user'
                          ? 'text-purple-200'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}

            {/* Loading indicator */}
            {loading && (
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-tl-md px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {t('AI думает...', 'AI ойлануда...')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Error Message */}
          {error && (
            <div className="px-4 sm:px-6 pb-2">
              <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t(
                  'Напишите ваш вопрос...',
                  'Сұрағыңызды жазыңыз...'
                )}
                className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 
                           bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100
                           placeholder-gray-400 dark:placeholder-gray-500
                           focus:outline-none focus:border-purple-400 dark:focus:border-purple-500
                           resize-none transition-colors text-sm sm:text-base"
                rows={1}
                maxLength={1000}
                disabled={loading}
              />
              <Button
                type="submit"
                disabled={!inputValue.trim() || loading}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-4 sm:px-6 h-auto"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </form>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
              {t(
                'Нажмите Enter для отправки, Shift+Enter для новой строки',
                'Жіберу үшін Enter басыңыз, жаңа жол үшін Shift+Enter'
              )}
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
}
