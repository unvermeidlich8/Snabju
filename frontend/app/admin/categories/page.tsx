'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import type { Category } from '@/lib/types';
import { ImageUpload } from '@/components/ui/ImageUpload';

const inputCls = 'w-full text-sm text-ink font-medium bg-transparent outline-none placeholder:text-muted';

interface FormState {
  title: string;
  imageUrl: string;
  sortOrder: number;
}

const emptyForm = (): FormState => ({ title: '', imageUrl: '', sortOrder: 0 });

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [editing, setEditing] = useState<Category | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    return () => { if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current); };
  }, []);

  const startEdit = (cat: Category) => {
    setEditing(cat);
    setForm({ title: cat.title, imageUrl: cat.imageUrl, sortOrder: cat.sortOrder });
    setError(''); setSuccess('');
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm(emptyForm());
    setError(''); setSuccess('');
  };

  const handleDeleteClick = (id: string) => {
    if (deletingId === id) {
      handleDeleteConfirm(id);
    } else {
      setDeletingId(id);
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = setTimeout(() => setDeletingId(null), 3000);
    }
  };

  const handleDeleteConfirm = async (id: string) => {
    setDeletingId(null);
    try {
      await api.adminDeleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      if (editing?.id === id) cancelEdit();
    } catch (e: any) {
      setError(e.message ?? 'Ошибка удаления');
    }
  };

  const handleSubmit = async () => {
    setError(''); setSuccess('');
    if (!form.title.trim()) { setError('Введите название'); return; }
    setSaving(true);
    try {
      if (editing) {
        const updated = await api.adminUpdateCategory(editing.id, {
          title: form.title.trim(),
          swatch: editing.swatch,
          icon: editing.icon,
          image_url: form.imageUrl,
          sort_order: form.sortOrder,
        });
        setCategories(prev => prev.map(c => c.id === updated.id ? updated : c));
        setSuccess(`Категория «${updated.title}» обновлена`);
        cancelEdit();
      } else {
        const cat = await api.adminCreateCategory({
          title: form.title.trim(),
          swatch: '#e8e3d8',
          icon: 'tool',
          image_url: form.imageUrl,
          sort_order: form.sortOrder,
        });
        setCategories(prev => [...prev, cat]);
        setForm(emptyForm());
        setSuccess(`Категория «${cat.title}» создана`);
      }
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
          {categories.map((c, i) => {
            const isDeleting = deletingId === c.id;
            const isEditingThis = editing?.id === c.id;
            return (
              <div
                key={c.id}
                className="flex items-center gap-3 px-4 py-3"
                style={{
                  borderBottom: i < categories.length - 1 ? '1px solid #e7e3da' : 'none',
                  background: isEditingThis ? '#fff8f4' : undefined,
                }}
              >
                {c.imageUrl ? (
                  <img src={c.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-surface shrink-0" />
                )}
                <div className="flex-1 text-sm font-semibold text-ink">{c.title}</div>
                <div className="text-xs text-muted font-mono mr-2">#{c.sortOrder}</div>

                <button
                  onClick={() => isEditingThis ? cancelEdit() : startEdit(c)}
                  className="w-7 h-7 rounded-lg grid place-items-center cursor-pointer transition-colors"
                  style={{ background: isEditingThis ? '#ff6a13' : '#f4f1eb' }}
                  title={isEditingThis ? 'Отменить' : 'Редактировать'}
                >
                  {isEditingThis ? (
                    <svg width="12" height="12" viewBox="0 0 12 12">
                      <path d="M2 2l8 8M10 2l-8 8" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 12 12">
                      <path d="M7.5 2.5l2 2L4 10H2V8L7.5 2.5z" fill="none" stroke="#3c3833" strokeWidth="1.4" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>

                <button
                  onClick={() => handleDeleteClick(c.id)}
                  className="h-7 rounded-lg grid place-items-center cursor-pointer transition-colors text-xs font-bold px-2"
                  style={{
                    background: isDeleting ? '#ef4444' : '#f4f1eb',
                    color: isDeleting ? '#fff' : '#3c3833',
                    minWidth: isDeleting ? 'auto' : 28,
                  }}
                  title="Удалить"
                >
                  {isDeleting ? 'Удалить?' : (
                    <svg width="12" height="12" viewBox="0 0 12 12">
                      <path d="M2 3h8M5 3V2h2v1M4 3v6h4V3" fill="none" stroke="#3c3833" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div ref={formRef} className="bg-white border border-divider rounded-[14px] p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-ink">
            {editing ? `Редактировать: ${editing.title}` : 'Новая категория'}
          </div>
          {editing && (
            <button onClick={cancelEdit} className="text-xs text-muted cursor-pointer hover:text-ink">
              Отмена
            </button>
          )}
        </div>

        <div className="border border-divider rounded-xl p-3.5">
          <div className="text-[11px] text-muted font-mono uppercase tracking-[0.4px] mb-1.5">Название</div>
          <input
            className={inputCls}
            placeholder="Например: Монтажная пена"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          />
        </div>

        <ImageUpload
          value={form.imageUrl}
          onChange={url => setForm(f => ({ ...f, imageUrl: url }))}
          label="Изображение категории"
        />

        <div className="border border-divider rounded-xl p-3.5">
          <div className="text-[11px] text-muted font-mono uppercase tracking-[0.4px] mb-1.5">Порядок сортировки</div>
          <input
            className={inputCls}
            type="number"
            min={0}
            value={form.sortOrder}
            onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))}
          />
        </div>

        {error && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}
        {success && <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">{success}</div>}

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full py-3 rounded-xl text-[15px] font-bold text-white cursor-pointer disabled:opacity-60"
          style={{ background: '#ff6a13' }}
        >
          {saving ? (editing ? 'Сохраняем…' : 'Создаём…') : (editing ? 'Сохранить изменения' : 'Создать категорию')}
        </button>
      </div>
    </div>
  );
}
