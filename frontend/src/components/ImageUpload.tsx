import { useState, useRef } from 'react';
import { Upload, Loader2, X, Image as ImageIcon } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;

export function ImageUpload({ value, onChange, label }: ImageUploadProps) {
  const { t } = useLanguage();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const cloudinaryConfigured = Boolean(CLOUD_NAME && UPLOAD_PRESET);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError(t('Только изображения (JPG, PNG, WebP)', 'Тек суреттер (JPG, PNG, WebP)'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(t('Файл не более 5 МБ', 'Файл 5 МБ-тан аспасын'));
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET!);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      onChange(data.secure_url as string);
    } catch {
      setError(t('Ошибка загрузки. Попробуйте снова.', 'Жүктеу қатесі. Қайта көріңіз.'));
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  // If Cloudinary is not configured — fallback to plain URL input
  if (!cloudinaryConfigured) {
    return (
      <div className="space-y-1">
        {label && <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600
                     bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-100
                     placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-colors"
        />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {label && <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}

      {/* Preview */}
      {value && (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-600 mb-2">
          <img src={value} alt="" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black/80 rounded-full
                       flex items-center justify-center text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Drop zone */}
      {!value && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="w-full aspect-video rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600
                     flex flex-col items-center justify-center gap-2 cursor-pointer
                     hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10
                     transition-colors"
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          ) : (
            <>
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center px-4">
                {t('Перетащите или нажмите для загрузки', 'Сүйреңіз немесе жүктеу үшін басыңыз')}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">JPG, PNG, WebP · max 5 MB</p>
            </>
          )}
        </div>
      )}

      {/* Also allow URL input as alternative */}
      <div className="flex items-center gap-2 mt-1">
        <Upload className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('или вставьте URL...', 'немесе URL енгізіңіз...')}
          className="flex-1 px-2 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-600
                     bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300
                     placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-colors"
        />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
    </div>
  );
}
