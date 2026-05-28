'use client';

import { useRef, useState } from 'react';
import { api } from '@/lib/api';

interface Props {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export function ImageUpload({ value, onChange, label = 'Изображение' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File) => {
    setError('');
    setUploading(true);
    try {
      const url = await api.adminUpload(file);
      onChange(url);
    } catch (e: any) {
      setError(e.message ?? 'Ошибка загрузки');
    } finally {
      setUploading(false);
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="text-[11px] text-muted font-mono uppercase tracking-[0.4px]">{label}</div>

      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-divider">
          <img src={value} alt="" className="w-full h-40 object-cover" />
          <button
            onClick={() => onChange('')}
            className="absolute top-2 right-2 w-7 h-7 rounded-lg grid place-items-center cursor-pointer"
            style={{ background: 'rgba(0,0,0,0.55)' }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path d="M1 1l8 8M9 1L1 9" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      ) : (
        <div
          className="border-2 border-dashed border-divider rounded-xl h-32 flex flex-col items-center justify-center gap-2 cursor-pointer"
          style={{ borderColor: uploading ? '#ff6a13' : undefined }}
          onClick={() => inputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={e => e.preventDefault()}
        >
          {uploading ? (
            <div className="text-sm text-muted">Загружаем…</div>
          ) : (
            <>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 15V3M7 8l5-5 5 5" stroke="#a8a39a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 17v2a2 2 0 002 2h14a2 2 0 002-2v-2" stroke="#a8a39a" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              <div className="text-sm text-muted">Нажмите или перетащите файл</div>
              <div className="text-xs text-faint">JPEG, PNG, WebP · до 5 МБ</div>
            </>
          )}
        </div>
      )}

      {error && <div className="text-xs text-red-500">{error}</div>}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onInputChange} />
    </div>
  );
}
