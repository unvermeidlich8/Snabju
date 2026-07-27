'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { CatTile } from '@/components/ui/CatTile';
import type { Category } from '@/lib/types';

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 pb-6">
      <div className="flex items-center gap-2.5 pb-4">
        <button
          onClick={() => router.push('/')}
          className="w-9 h-9 bg-white border border-divider rounded-[10px] grid place-items-center cursor-pointer shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M9 2L3 7l6 5" fill="none" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div>
          <div className="text-[11px] text-muted font-mono tracking-[0.5px] uppercase">Каталог</div>
          <h1 className="m-0 text-[22px] font-bold text-ink" style={{ letterSpacing: '-0.4px' }}>Все категории</h1>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-muted">Загружаем категории…</div>
      ) : categories.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted">Категории не найдены</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {categories.map(cat => (
            <CatTile
              key={cat.id}
              cat={cat}
              onClick={() => router.push(`/catalog?category=${cat.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
