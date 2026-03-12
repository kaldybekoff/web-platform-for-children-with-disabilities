import { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import * as meApi from '../api/me';

interface AccountSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccountSettingsModal({ open, onOpenChange }: AccountSettingsModalProps) {
  const { t } = useLanguage();
  const { user, refreshUser } = useAuth();
  
  // Profile form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // UI state
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Load current user data when modal opens
  useEffect(() => {
    if (open && user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setEmail(user.email || '');
      // Reset password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      // Reset messages
      setProfileSuccess('');
      setPasswordSuccess('');
      setProfileError('');
      setPasswordError('');
    }
  }, [open, user]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileError('');
    setProfileSuccess('');
    
    try {
      await meApi.updateMe({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
      });
      await refreshUser();
      setProfileSuccess(t('Данные сохранены', 'Деректер сақталды'));
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('Ошибка сохранения', 'Сақтау қатесі');
      setProfileError(message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');
    
    if (!currentPassword) {
      setPasswordError(t('Введите текущий пароль', 'Ағымдағы құпия сөзді енгізіңіз'));
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError(t('Новый пароль должен быть не менее 6 символов', 'Жаңа құпия сөз кемінде 6 таңбадан тұруы керек'));
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError(t('Пароли не совпадают', 'Құпия сөздер сәйкес келмейді'));
      return;
    }
    
    setSavingPassword(true);
    
    try {
      await meApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordSuccess(t('Пароль изменен', 'Құпия сөз өзгертілді'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('Ошибка смены пароля', 'Құпия сөзді өзгерту қатесі');
      if (message.includes('incorrect') || message.includes('Current password')) {
        setPasswordError(t('Неверный текущий пароль', 'Ағымдағы құпия сөз қате'));
      } else {
        setPasswordError(message);
      }
    } finally {
      setSavingPassword(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-purple-700 dark:text-purple-400">
            {t('Настройки аккаунта', 'Тіркелгі параметрлері')}
          </DialogTitle>
        </DialogHeader>
        
        {/* Profile Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 pb-2">
            {t('Личные данные', 'Жеке деректер')}
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{t('Имя', 'Аты')}</Label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder={t('Имя', 'Аты')}
                className="h-9 rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t('Фамилия', 'Тегі')}</Label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder={t('Фамилия', 'Тегі')}
                className="h-9 rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-xs">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="h-9 rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          
          {profileError && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-3 py-2 rounded-lg">
              {profileError}
            </p>
          )}
          
          {profileSuccess && (
            <p className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-3 py-2 rounded-lg">
              {profileSuccess}
            </p>
          )}
          
          <Button
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="w-full rounded-xl bg-purple-600 hover:bg-purple-700"
          >
            {savingProfile ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('Сохранение...', 'Сақтау...')}
              </>
            ) : (
              t('Сохранить данные', 'Деректерді сақтау')
            )}
          </Button>
        </div>

        {/* Password Section */}
        <div className="space-y-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('Смена пароля', 'Құпия сөзді өзгерту')}
          </h3>
          
          <div className="space-y-1.5">
            <Label className="text-xs">{t('Текущий пароль', 'Ағымдағы құпия сөз')}</Label>
            <div className="relative">
              <Input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="h-9 rounded-lg pr-10 dark:bg-gray-700 dark:border-gray-600"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-xs">{t('Новый пароль', 'Жаңа құпия сөз')}</Label>
            <div className="relative">
              <Input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="h-9 rounded-lg pr-10 dark:bg-gray-700 dark:border-gray-600"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-xs">{t('Подтвердите пароль', 'Құпия сөзді растаңыз')}</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="h-9 rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          
          {passwordError && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-3 py-2 rounded-lg">
              {passwordError}
            </p>
          )}
          
          {passwordSuccess && (
            <p className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-3 py-2 rounded-lg">
              {passwordSuccess}
            </p>
          )}
          
          <Button
            onClick={handleChangePassword}
            disabled={savingPassword || !currentPassword || !newPassword}
            variant="outline"
            className="w-full rounded-xl border-2 dark:border-gray-600"
          >
            {savingPassword ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('Изменение...', 'Өзгерту...')}
              </>
            ) : (
              t('Изменить пароль', 'Құпия сөзді өзгерту')
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
