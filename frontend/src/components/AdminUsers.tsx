import { useState, useEffect } from 'react';
import { Users, Search, Trash2 } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useLanguage } from '../contexts/LanguageContext';
import * as adminApi from '../api/admin';
import type { UserResponse } from '../api/types';

const ROLE_LABELS: Record<string, { ru: string; kz: string }> = {
  student: { ru: 'Ученик', kz: 'Оқушы' },
  teacher: { ru: 'Учитель', kz: 'Мұғалім' },
  admin: { ru: 'Админ', kz: 'Админ' },
};

export function AdminUsers() {
  const { t, language } = useLanguage();
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [search, setSearch] = useState('');

  const loadUsers = async (searchTerm?: string) => {
    setLoading(true);
    try {
      const data = await adminApi.listUsers({ search: searchTerm, per_page: 50 });
      setUsers(data.users);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const handleSearch = () => {
    loadUsers(search);
  };

  const handleDelete = async (userId: number) => {
    if (!confirm(t('Удалить пользователя?', 'Пайдаланушыны жою керек пе?'))) return;
    try {
      await adminApi.deleteUser(userId);
      loadUsers(search);
      showSuccess(t('Пользователь удален', 'Пайдаланушы жойылды'));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-purple-700 dark:text-purple-400 text-lg">{t('Пользователи', 'Пайдаланушылар')}</h2>
            <p className="text-gray-600 dark:text-gray-400 text-xs">{t('Управление пользователями', 'Пайдаланушыларды басқару')}</p>
          </div>
        </div>
      </div>

      {successMsg && (
        <p className="text-sm text-green-600 dark:text-green-400 mb-3 rounded-lg bg-green-50 dark:bg-green-900/30 px-3 py-2">{successMsg}</p>
      )}

      <Card className="p-3 mb-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-100 dark:border-gray-700">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={t('Поиск по имени или email...', 'Аты немесе email бойынша іздеу...')} 
              className="pl-8 h-9 rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600" 
            />
          </div>
          <Button onClick={handleSearch} size="sm" className="h-9">
            {t('Найти', 'Іздеу')}
          </Button>
        </div>
      </Card>

      {loading ? (
        <p className="text-purple-600 dark:text-purple-400 text-sm">{t('Загрузка...', 'Жүктелуде...')}</p>
      ) : (
        <Card className="p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400 text-xs font-medium">{t('Имя', 'Аты')}</th>
                  <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400 text-xs font-medium">Email</th>
                  <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400 text-xs font-medium">{t('Роль', 'Рөл')}</th>
                  <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400 text-xs font-medium">{t('Действия', 'Әрекеттер')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-2 px-3 text-gray-800 dark:text-gray-100">{u.first_name} {u.last_name}</td>
                    <td className="py-2 px-3 text-gray-600 dark:text-gray-400 text-xs">{u.email}</td>
                    <td className="py-2 px-3 text-gray-600 dark:text-gray-400">
                      {t(ROLE_LABELS[u.role]?.ru || u.role, ROLE_LABELS[u.role]?.kz || u.role)}
                    </td>
                    <td className="py-2 px-3">
                      <Button variant="outline" size="sm" className="rounded-lg h-7 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleDelete(u.id)}>
                        <Trash2 className="w-3 h-3 mr-1" />
                        {t('Удалить', 'Жою')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
            {t(`Всего: ${total} пользователей`, `Барлығы: ${total} пайдаланушы`)}
          </p>
        </Card>
      )}
    </section>
  );
}
