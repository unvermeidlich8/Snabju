'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Category } from '@/lib/types';
import { ImageUpload } from '@/components/ui/ImageUpload';

const inputCls = 'w-full text-sm text-ink font-medium bg-transparent outline-none placeholder:text-muted';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  const handleCreate = async () => {
    setError(''); setSuccess('');
    if (!title.trim()) { setError('Введите название'); return; }
    setSaving(true);
    try {
      const cat = await api.adminCreateCategory({
        title: title.trim(),
        swatch: '#e8e3d8',
        icon: 'tool',
        image_url: imageUrl,
        sort_order: sortOrder,
      });
      setCategories(prev => [...prev, cat]);
      setTitle(''); setImageUrl(''); setSortOrder(0);
      setSuccess(`Категория «${cat.title}» создана`);
    } catch (e: any) {
      setError(e.message ?? 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold text-ink m-0" style={{ letterSpacing: '-0.5px' }}>Категории</h1>

      {categories.length > 0 && (
        <div className="bg-white border border-divider rounded-[14px] overflow-hidden">
          {categories.map((c, i) => (
            <div
              key={c.id}
              className="flex items-center gap-3 px-4 py-3"
              style={{ borderBottom: i < categories.length - 1 ? '1px solid #e7e3da' : 'none' }}
            >
              {c.imageUrl ? (
                <img src={c.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-surface shrink-0" />
              )}
              <div className="flex-1 text-sm font-semibold text-ink">{c.title}</div>
              <div className="text-xs text-muted font-mono">#{c.sortOrder}</div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white border border-divider rounded-[14px] p-4 flex flex-col gap-4">
        <div className="text-sm font-bold text-ink">Новая категория</div>

        <div className="border border-divider rounded-xl p-3.5">
          <div className="text-[11px] text-muted font-mono uppercase tracking-[0.4px] mb-1.5">Название</div>
          <input className={inputCls} placeholder="Например: Монтажная пена" value={title} onChange={e => setTitle(e.target.value)} />
        </div>

        <ImageUpload value={imageUrl} onChange={setImageUrl} label="Изображение категории" />

        <div className="border border-divider rounded-xl p-3.5">
          <div className="text-[11px] text-muted font-mono uppercase tracking-[0.4px] mb-1.5">Порядок сортировки</div>
          <input className={inputCls} type="number" min={0} value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} />
        </div>

        {error && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}
        {success && <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">{success}</div>}

        <button
          onClick={handleCreate}
          disabled={saving}
          className="w-full py-3 rounded-xl text-[15px] font-bold text-white cursor-pointer disabled:opacity-60"
          style={{ background: '#ff6a13' }}
        >
          {saving ? 'Создаём…' : 'Создать категорию'}
        </button>
      </div>
    </div>
  );
}
