'use client';

import type { Product, Mode } from '@/lib/types';
import { ProductImage } from '@/components/ui/ProductImage';
import { PriceBlock } from '@/components/ui/PriceBlock';

interface ProductCardSmallProps {
  p: Product;
  mode: Mode;
  onClick: () => void;
  onAddToCart: () => void;
}

export function ProductCardSmall({ p, mode, onClick, onAddToCart }: ProductCardSmallProps) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer bg-white border border-divider rounded-[14px] p-2.5 flex flex-col gap-2"
    >
      <ProductImage size="md" tag={p.tag} swatch={p.swatch} imageUrl={p.imageUrl} />
      <div className="text-[11px] text-muted font-mono">{p.catLabel}</div>
      <div className="text-[13px] font-semibold text-ink leading-tight line-clamp-2">{p.title}</div>
      <PriceBlock p={p} mode={mode} size="sm" />
      <button
        onClick={e => { e.stopPropagation(); onAddToCart(); }}
        className="bg-brand border border-divider rounded-[10px] py-2 text-[13px] font-semibold text-ink cursor-pointer w-full"
      >
        В корзину
      </button>
    </div>
  );
}