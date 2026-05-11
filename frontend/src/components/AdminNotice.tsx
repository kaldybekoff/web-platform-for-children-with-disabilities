import { ExternalLink, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

// The admin panel now lives in a separate service (starlette-admin) on its own
// subdomain. Configure it via VITE_ADMIN_URL at build time.
const ADMIN_URL = (import.meta.env.VITE_ADMIN_URL as string | undefined) ?? 'https://admin.qazedu.kz';

export function AdminNotice() {
  const { t } = useLanguage();

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-md border-2 border-purple-200 dark:border-purple-700 p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center">
          <ShieldCheck className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-purple-600 dark:text-purple-400 mb-2">
          {t('Админ-панель переехала', 'Әкімші панелі көшірілді')}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {t(
            'Управление пользователями, курсами и контентом теперь доступно в отдельной админ-панели.',
            'Пайдаланушыларды, курстарды және мазмұнды басқару енді бөлек әкімші панелінде қолжетімді.',
          )}
        </p>
        <a
          href={ADMIN_URL}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-purple-500 hover:bg-purple-600 text-white transition-colors"
        >
          {t('Открыть админ-панель', 'Әкімші панелін ашу')}
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
