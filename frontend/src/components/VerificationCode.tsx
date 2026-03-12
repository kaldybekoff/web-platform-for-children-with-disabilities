import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { useLanguage } from '../contexts/LanguageContext';

interface VerificationCodeProps {
  length?: number;
  onComplete: (code: string) => void;
  onResend: () => void;
}

export function VerificationCode({ length = 6, onComplete, onResend }: VerificationCodeProps) {
  const { t } = useLanguage();
  const [code, setCode] = useState<string[]>(new Array(length).fill(''));
  const [timer, setTimer] = useState(60);

  // Корректная типизация массива inputRefs
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  useEffect(() => {
    // Фокус на первый input
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newCode.every((digit) => digit !== '')) {
      onComplete(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, length);

    if (!/^\d+$/.test(pastedData)) return;

    const newCode = [...code];

    pastedData.split('').forEach((char, index) => {
      if (index < length) {
        newCode[index] = char;
      }
    });

    setCode(newCode);

    const lastIdx = Math.min(pastedData.length, length) - 1;
    inputRefs.current[lastIdx]?.focus();

    if (newCode.every((digit) => digit !== '')) {
      onComplete(newCode.join(''));
    }
  };

  const handleResend = () => {
    setTimer(60);
    setCode(new Array(length).fill(''));
    inputRefs.current[0]?.focus();
    onResend();
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 justify-center">
        {code.map((digit, index) => (
          <input
            key={index}
            ref={(el: HTMLInputElement | null) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className="w-12 h-14 text-center text-2xl border-2 border-gray-300 dark:border-gray-600 rounded-xl
                       bg-white text-gray-900 focus:border-purple-500 focus:outline-none dark:bg-gray-700 dark:text-white transition-colors"
          />
        ))}
      </div>

      <div className="text-center">
        {timer > 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('Отправить код повторно через', 'Кодты қайта жіберу')} {timer} {t('сек', 'сек')}
          </p>
        ) : (
          <Button
            onClick={handleResend}
            variant="link"
            className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
          >
            {t('Отправить код повторно', 'Кодты қайта жіберу')}
          </Button>
        )}
      </div>
    </div>
  );
}
