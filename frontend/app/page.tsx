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

export default function HomePage() {
  const router = useRouter();
  const { mode } = useMode();
  const { addToCart } = useCart();
  const [search, setSearch] = useState('');

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    api.getCategories().then(cats => {
      setCategories(cats);
      return api.getProducts({ limit: 6 });
    }).then(res => setProducts(res.items)).catch(() => {});
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Top bar */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <BrandMark size={22} />
        <ModeChip />
      </div>

      {/* Search */}
      <div className="px-4 pb-4">
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
            placeholder="Артикул, материал, бренд…"
            className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
          />
        </form>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <>
          <SectionHeader title="Категории" action="всё" onAction={() => router.push('/catalog')} />
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
