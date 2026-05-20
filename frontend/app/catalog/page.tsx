'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SNABJU_DATA } from '@/lib/data';
import { useMode } from '@/providers/ModeProvider';
import { useCart } from '@/providers/CartProvider';
import { ModeChip } from '@/components/ui/ModeChip';
import { ProductCardList } from '@/components/cards/ProductCardList';
import { FilterSheet } from '@/components/catalog/FilterSheet';

export default function CatalogPage() {
  const router = useRouter();
  const { mode } = useMode();
  const { addToCart } = useCart();
  const D = SNABJU_DATA;

  const [activeCat, setActiveCat] = useState('mineral');
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>(['Толщина 50']);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Top bar */}
      <div className="px-4 pt-4 pb-2.5 flex items-center gap-2.5">
        <button
          onClick={() => router.push('/')}
          className="w-9 h-9 bg-white border border-divider rounded-[10px] grid place-items-center cursor-pointer shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M9 2L3 7l6 5" fill="none" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="flex-1">
          <div className="text-[11px] text-muted font-mono tracking-[0.5px] uppercase">Каталог</div>
          <div className="text-[17px] font-bold text-ink" style={{ letterSpacing: '-0.3px', lineHeight: 1.2 }}>
            {D.categories.find(c => c.id === activeCat)?.title ?? 'Все товары'}
          </div>
        </div>
        <ModeChip mode={mode} />
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-3.5 scrollbar-hide">
        {D.categories.map(c => {
          const on = c.id === activeCat;
          return (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.id)}
              className="shrink-0 px-3.5 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap cursor-pointer border"
              style={{
                background: on ? '#1a1a1a' : '#fff',
                color: on ? '#fff' : '#3c3833',
                borderColor: on ? '#1a1a1a' : '#e7e3da',
              }}
            >
              {c.title}
            </button>
          );
        })}
      </div>

      {/* Filter row */}
      <div className="sticky top-0 z-10 px-4 py-2 bg-brand border-b border-divider flex items-center gap-2 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setFilterOpen(true)}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-ink text-white rounded-full text-xs font-semibold cursor-pointer"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M1 2h10M3 6h6M5 10h2" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
          Фильтры · {activeFilters.length}
        </button>
        {activeFilters.map(f => (
          <span
            key={f}
            className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-divider rounded-full text-xs text-ink2"
          >
            {f}
            <button
              onClick={() => setActiveFilters(activeFilters.filter(x => x !== f))}
              className="text-muted"
            >
              ×
            </button>
          </span>
        ))}
        <span className="ml-auto shrink-0 text-xs text-muted font-mono">
          {D.products.length} SKU
        </span>
      </div>

      {/* Sort */}
      <div className="px-4 py-3 flex items-center justify-between">
        <span className="text-xs text-muted">Сортировка</span>
        <span className="text-[13px] font-semibold text-ink flex items-center gap-1">
          по популярности
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path d="M2 4l3 3 3-3" stroke="#1a1a1a" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
          </svg>
        </span>
      </div>

      {/* Product list */}
      <div className="flex flex-col gap-2.5 px-4 pb-6">
        {D.products.map(p => (
          <ProductCardList
            key={p.id}
            p={p}
            mode={mode}
            onClick={() => router.push(`/product/${p.id}`)}
            onAddToCart={() => addToCart(p.id, 1)}
          />
        ))}
      </div>

      {filterOpen && (
        <FilterSheet
          active={activeFilters}
          onClose={() => setFilterOpen(false)}
          onApply={setActiveFilters}
        />
      )}
    </div>
  );
}
