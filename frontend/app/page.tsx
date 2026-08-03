'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useMode } from '@/providers/ModeProvider';
import { useCart } from '@/providers/CartProvider';
import { BrandMark } from '@/components/ui/BrandMark';
import { ModeChip } from '@/components/ui/ModeChip';
import { CatTile } from '@/components/ui/CatTile';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ProductCardSmall } from '@/components/cards/ProductCardSmall';
import type { Category, Product } from '@/lib/types';
import { fmt } from '@/lib/format';

export default function HomePage() {
  const router = useRouter();
  const { mode } = useMode();
  const { addToCart } = useCart();
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    api.getCategories().then(cats => {
      setCategories(cats);
      return api.getProducts({ limit: 6 });
    }).then(res => setProducts(res.items)).catch(() => {});
  }, []);

  useEffect(() => {
    const query = search.trim();
    if (query.length < 2) { setSuggestions([]); setSearching(false); return; }
    let active = true;
    setSearching(true);
    const timer = window.setTimeout(() => {
      api.getProducts({ q: query, limit: 8 }).then(({ items }) => {
        if (!active) return;
        const needle = query.toLowerCase();
        setSuggestions(items.sort((a, b) => {
          const score = (p: Product) => p.sku.toLowerCase() === needle ? 0 : p.title.toLowerCase().startsWith(needle) ? 1 : p.sku.toLowerCase().startsWith(needle) ? 2 : 3;
          return score(a) - score(b);
        }).slice(0, 5));
      }).catch(() => { if (active) setSuggestions([]); }).finally(() => { if (active) setSearching(false); });
    }, 220);
    return () => { active = false; window.clearTimeout(timer); };
  }, [search]);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Top bar */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <BrandMark size={22} />
        <ModeChip />
      </div>

      {/* Search */}
      <div className="px-4 pb-4 relative z-20">
        <form
          onSubmit={e => { e.preventDefault(); if (search.trim()) router.push(`/catalog?q=${encodeURIComponent(search.trim())}`); }}
          className="flex items-center gap-2.5 bg-white border border-divider rounded-[14px] px-3.5 py-3"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" className="shrink-0">
            <circle cx="8" cy="8" r="5.5" fill="none" stroke="#7a756d" strokeWidth="1.6"/>
            <path d="M12 12l4 4" stroke="#7a756d" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setSuggestionsOpen(true)}
            onBlur={() => window.setTimeout(() => setSuggestionsOpen(false), 150)}
            placeholder="Артикул, материал, бренд…"
            className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
          />
        </form>
        {suggestionsOpen && search.trim().length >= 2 && (
          <div className="absolute left-4 right-4 top-[58px] bg-white border border-divider rounded-[14px] overflow-hidden shadow-lg">
            {searching && <div className="px-3.5 py-3 text-sm text-muted">Ищем товары…</div>}
            {!searching && suggestions.map(p => (
              <button key={p.id} onMouseDown={e => e.preventDefault()} onClick={() => { setSuggestionsOpen(false); router.push(`/product/${p.id}`); }} className="w-full px-3.5 py-3 flex items-center gap-3 text-left border-b border-divider last:border-0 hover:bg-brand cursor-pointer">
                <div className="w-10 h-10 rounded-lg shrink-0 overflow-hidden" style={{ background: p.swatch }}>{p.imageUrl && <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />}</div>
                <div className="flex-1 min-w-0"><div className="text-sm font-semibold text-ink truncate">{p.title}</div><div className="text-[11px] text-muted font-mono">{p.sku} · {p.catLabel}</div></div>
                <div className="text-sm font-bold text-ink font-mono">{fmt(p.price)}</div>
              </button>
            ))}
            {!searching && suggestions.length === 0 && <div className="px-3.5 py-3 text-sm text-muted">Ничего не нашли</div>}
            {!searching && suggestions.length > 0 && <button onMouseDown={e => e.preventDefault()} onClick={() => router.push(`/catalog?q=${encodeURIComponent(search.trim())}`)} className="w-full px-3.5 py-3 text-left text-sm font-semibold text-accent cursor-pointer">Все результаты по запросу «{search.trim()}»</button>}
          </div>
        )}
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <>
          <SectionHeader title="Категории" action="всё" onAction={() => router.push('/categories')} />
          <div className="grid grid-cols-3 gap-3 px-4 pb-6">
            {categories.slice(0, 6).map(c => (
              <CatTile key={c.id} cat={c} onClick={() => router.push(`/catalog?category=${c.id}`)} />
            ))}
          </div>
        </>
      )}

      {/* Hits */}
      {products.length > 0 && (
        <>
          <SectionHeader title="Хиты склада" action="всё" onAction={() => router.push('/catalog')} />
          <div className="flex gap-3 overflow-x-auto px-4 pb-6 scrollbar-hide" style={{ scrollSnapType: 'x mandatory' }}>
            {products.map(p => (
              <div key={p.id} className="shrink-0 w-[200px]" style={{ scrollSnapAlign: 'start' }}>
                <ProductCardSmall
                  p={p}
                  mode={mode}
                  onClick={() => router.push(`/product/${p.id}`)}
                  onAddToCart={() => addToCart(p.id, 1)}
                />
              </div>
            ))}
          </div>
        </>
      )}

    </div>
  );
}
