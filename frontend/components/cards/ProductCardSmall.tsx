'use client';

import { useState } from 'react';
import type { Product } from '@/lib/types';
import { ProductImage } from '@/components/ui/ProductImage';
import { PriceBlock } from '@/components/ui/PriceBlock';

interface ProductCardSmallProps {
  p: Product;
  onClick: () => void;
  onAddToCart: () => Promise<void>;
}

export function ProductCardSmall({ p, onClick, onAddToCart }: ProductCardSmallProps) {
  const [adding, setAdding] = useState(false);

  return (
    <div
      onClick={onClick}
      className="cursor-pointer bg-white border border-divider rounded-[14px] p-2.5 flex flex-col gap-2"
    >
      <ProductImage size="md" tag={p.tag} swatch={p.swatch} imageUrl={p.imageUrl} />
      <div className="text-[11px] text-muted font-mono">{p.catLabel}</div>
      <div className="text-[13px] font-semibold text-ink leading-tight line-clamp-2">{p.title}</div>
      <PriceBlock p={p} size="sm" />
      <button
        onClick={async e => {
          e.stopPropagation();
          if (adding) return;
          setAdding(true);
          try {
            await onAddToCart();
          } finally {
            setAdding(false);
          }
        }}
        disabled={adding}
        className="bg-brand border border-divider rounded-[10px] py-2 text-[13px] font-semibold text-ink cursor-pointer w-full"
      >
        {adding ? 'Добавляем…' : 'В корзину'}
      </button>
    </div>
  );
}
