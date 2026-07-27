'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useMode } from '@/providers/ModeProvider';
import { useCart } from '@/providers/CartProvider';
import { ModeChip } from '@/components/ui/ModeChip';
import { ProductCardList } from '@/components/cards/ProductCardList';
import { FilterSheet } from '@/components/catalog/FilterSheet';
import type { Category, Product } from '@/lib/types';

const LIMIT = 20;

type SortKey = 'popular' | 'price_asc' | 'price_desc' | 'new';
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'popular',    label: 'по популярности' },
  { key: 'price_asc',  label: 'цена ↑' },
  { key: 'price_desc', label: 'цена ↓' },
  { key: 'new',        label: 'новые' },
];

export default function CatalogPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { mode } = useMode();
  const { addToCart } = useCart();

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [activeCat, setActiveCat] = useState(searchParams.get('category') ?? '');
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [sort, setSort] = useState<SortKey>((searchParams.get('sort') as SortKey) ?? 'popular');
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>(searchParams.getAll('brand'));
  const [loading, setLoading] = useState(true);
  const hasActiveControls = Boolean(search) || sort !== 'popular' || activeFilters.length > 0;

  useEffect(() => {
    api.getCategories().then(cats => {
      setCategories(cats);
      if (!activeCat && cats.length > 0) setActiveCat(cats[0].id);
    }).catch(() => {});
    api.getBrands().then(setBrands).catch(() => {});
  }, []);

  const fetchProducts = useCallback(async (catId: string, s: SortKey, q: string, selectedBrands: string[]) => {
    setLoading(true);
    try {
      const res = await api.getProducts({
        category_id: q ? undefined : (catId || undefined),
        q: q || undefined,
        limit: LIMIT,
        sort: s,
        brands: selectedBrands,
      });
      setProducts(res.items);
      setTotal(res.total);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (search || activeCat || categories.length === 0) fetchProducts(activeCat, sort, search, activeFilters);
  }, [activeCat, sort, search, activeFilters, fetchProducts]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (activeCat) params.set('category', activeCat);
    if (search) params.set('q', search);
    if (sort && sort !== 'popular') params.set('sort', sort);
    activeFilters.forEach(brand => params.append('brand', brand));

    const query = params.toString();
    router.replace(query ? `/catalog?${query}` : '/catalog');
  }, [activeCat, search, sort, activeFilters, router]);

  const activeCatTitle = categories.find(c => c.id === activeCat)?.title ?? 'Все товары';
  const activeSortLabel = SORT_OPTIONS.find(o => o.key === sort)?.label ?? 'по популярности';
  const resetControls = () => {
    setSearch('');
    setSort('popular');
    setActiveFilters([]);
  };

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
            {activeCatTitle}
          </div>
        </div>
        <ModeChip />
      </div>

      {/* Search */}
      <div className="px-4 pb-3">
        <form
          onSubmit={e => e.preventDefault()}
          className="flex items-center gap-2.5 bg-white border border-divider rounded-[14px] px-3.5 py-2.5"
        >
          <svg width="16" height="16" viewBox="0 0 18 18" className="shrink-0">
            <circle cx="8" cy="8" r="5.5" fill="none" stroke="#7a756d" strokeWidth="1.6"/>
            <path d="M12 12l4 4" stroke="#7a756d" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Артикул, материал, бренд…"
            className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} className="text-muted text-lg leading-none cursor-pointer">×</button>
          )}
        </form>
      </div>

      {/* Category chips */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-4 pb-3.5 scrollbar-hide">
          {categories.map(c => {
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
                {c.title} · {c.productsCount}
              </button>
            );
          })}
        </div>
      )}

      {/* Filter row */}
      <div className="sticky top-0 z-10 px-4 py-2 bg-brand border-b border-divider flex items-center gap-2 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setFilterOpen(true)}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-ink text-white rounded-full text-xs font-semibold cursor-pointer"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M1 2h10M3 6h6M5 10h2" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
          Бренды{activeFilters.length > 0 && ` · ${activeFilters.length}`}
        </button>
        {activeFilters.map(f => (
          <span key={f} className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-divider rounded-full text-xs text-ink2">
            {f}
            <button onClick={() => setActiveFilters(activeFilters.filter(x => x !== f))} className="text-muted">×</button>
          </span>
        ))}
        {hasActiveControls && (
          <button
            onClick={resetControls}
            className="shrink-0 text-xs font-semibold text-accent cursor-pointer"
          >
            Сбросить всё
          </button>
        )}
        <span className="ml-auto shrink-0 text-xs text-muted font-mono">{total} SKU</span>
      </div>

      {/* Sort */}
      <div className="px-4 py-3 flex items-center justify-between relative">
        <span className="text-xs text-muted">Сортировка</span>
        <button
          onClick={() => setSortOpen(o => !o)}
          className="text-[13px] font-semibold text-ink flex items-center gap-1 cursor-pointer"
        >
          {activeSortLabel}
          <svg
            width="10" height="10" viewBox="0 0 10 10"
            style={{ transform: sortOpen ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s' }}
          >
            <path d="M2 4l3 3 3-3" stroke="#1a1a1a" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
          </svg>
        </button>

        {sortOpen && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setSortOpen(false)} />
            <div
              className="absolute right-4 top-full z-30 bg-white border border-divider rounded-[14px] overflow-hidden shadow-lg"
              style={{ minWidth: 180 }}
            >
              {SORT_OPTIONS.map((o, i) => (
                <button
                  key={o.key}
                  onClick={() => { setSort(o.key); setSortOpen(false); }}
                  className="w-full px-4 py-3 text-left text-[13px] font-medium flex items-center justify-between cursor-pointer"
                  style={{
                    borderTop: i > 0 ? '1px solid #e7e3da' : 'none',
                    color: sort === o.key ? '#ff6a13' : '#1a1a1a',
                    fontWeight: sort === o.key ? 700 : 500,
                  }}
                >
                  {o.label}
                  {sort === o.key && (
                    <svg width="14" height="14" viewBox="0 0 14 14">
                      <path d="M2 7l4 4 6-6" stroke="#ff6a13" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Product list */}
      {loading ? (
        <div className="px-4 py-8 text-center text-sm text-muted">Загружаем товары…</div>
      ) : products.length === 0 ? (
        <div className="px-4 py-10">
          <div className="bg-white border border-divider rounded-[16px] px-5 py-8 text-center">
            <div className="text-base font-bold text-ink">Товаров не найдено</div>
            <div className="mt-1.5 text-sm text-muted">
              {activeFilters.length > 0 || search
                ? 'Попробуйте убрать часть брендов или очистить поиск.'
                : 'Попробуйте выбрать другую категорию.'}
            </div>
            {hasActiveControls && (
              <button
                onClick={resetControls}
                className="mt-4 px-4 py-2 rounded-xl bg-ink text-white text-[13px] font-semibold cursor-pointer"
              >
                Сбросить фильтры
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 px-4 pb-6">
          {products.map(p => (
            <ProductCardList
              key={p.id}
              p={p}
              mode={mode}
              onClick={() => router.push(`/product/${p.id}`)}
              onAddToCart={() => addToCart(p.id, 1)}
            />
          ))}
        </div>
      )}

      {filterOpen && (
        <FilterSheet
          brands={brands}
          active={activeFilters}
          onClose={() => setFilterOpen(false)}
          onApply={setActiveFilters}
        />
      )}
    </div>
  );
}
