import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useLanguage } from '../contexts/LanguageContext';

interface AccountSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const defaultValues = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  newPassword: '',
};

export function AccountSettingsModal({ open, onOpenChange }: AccountSettingsModalProps) {
  const { t } = useLanguage();
  const [form, setForm] = useState(defaultValues);
  const [success, setSuccess] = useState(false);

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = () => {
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onOpenChange(false);
    }, 1800);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) setForm(defaultValues);
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-purple-700 dark:text-purple-400">
            {t('Настройки аккаунта', 'Тіркелгі параметрлері')}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">{t('Имя', 'Аты')}</Label>
              <Input
                value={form.firstName}
                onChange={handleChange('firstName')}
                placeholder={t('Имя', 'Аты')}
                className="h-9 rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">{t('Фамилия', 'Тегі')}</Label>
              <Input
                value={form.lastName}
                onChange={handleChange('lastName')}
                placeholder={t('Фамилия', 'Тегі')}
                className="h-9 rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t('Телефон', 'Телефон')}</Label>
            <Input
              value={form.phone}
              onChange={handleChange('phone')}
              placeholder="+7"
              className="h-9 rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              placeholder="email@example.com"
              className="h-9 rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t('Новый пароль', 'Жаңа құпия сөз')}</Label>
            <Input
              type="password"
              value={form.newPassword}
              onChange={handleChange('newPassword')}
              placeholder="••••••••"
              className="h-9 rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
        </div>
        {success && (
          <p className="text-sm text-green-600 dark:text-green-400 rounded-lg bg-green-50 dark:bg-green-900/30 px-3 py-2">
            {t('Настройки сохранены (мок)', 'Параметрлер сақталды (мок)')}
          </p>
        )}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            className="rounded-xl bg-purple-600 hover:bg-purple-700"
            onClick={handleSave}
          >
            {t('Сохранить', 'Сақтау')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
