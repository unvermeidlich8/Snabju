'use client';

import type { Product, Mode } from '@/lib/types';
import { ProductImage } from '@/components/ui/ProductImage';
import { PriceBlock } from '@/components/ui/PriceBlock';
import { StockPill } from '@/components/ui/StockPill';

interface ProductCardListProps {
  p: Product;
  mode: Mode;
  onClick: () => void;
  onAddToCart: () => void;
}

export function ProductCardList({ p, mode, onClick, onAddToCart }: ProductCardListProps) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer bg-white border border-divider rounded-[14px] p-3 flex gap-3"
    >
      <div className="w-24 shrink-0">
        <ProductImage size="sm" tag={p.tag} cat={p.cat} />
      </div>
      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
        <div className="text-[10.5px] text-muted font-mono tracking-[0.3px]">{p.sku}</div>
        <div className="text-sm font-semibold text-ink leading-tight">{p.title}</div>
        <div className="text-[11.5px] text-muted">{p.sub}</div>
        <StockPill stock={p.stock} eta={p.eta} />
        <div className="flex items-end justify-between mt-0.5">
          <PriceBlock p={p} mode={mode} size="sm" />
          <button
            onClick={e => { e.stopPropagation(); onAddToCart(); }}
            className="w-9 h-9 rounded-[10px] bg-ink text-white grid place-items-center cursor-pointer shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M8 3v10M3 8h10" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
