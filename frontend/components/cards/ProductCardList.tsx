'use client';

import { useState } from 'react';
import type { Product, Mode } from '@/lib/types';
import { ProductImage } from '@/components/ui/ProductImage';
import { PriceBlock } from '@/components/ui/PriceBlock';
import { StockPill } from '@/components/ui/StockPill';

interface ProductCardListProps {
  p: Product;
  mode: Mode;
  onClick: () => void;
  onAddToCart: () => Promise<void>;
}

export function ProductCardList({ p, mode, onClick, onAddToCart }: ProductCardListProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');

  const handleAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (state !== 'idle') return;
    setState('loading');
    try {
      await onAddToCart();
      setState('done');
      setTimeout(() => setState('idle'), 1400);
    } catch {
      setState('idle');
    }
  };

  return (
    <div
      onClick={onClick}
      className="cursor-pointer bg-white border border-divider rounded-[14px] p-3 flex gap-3"
    >
      <div className="w-24 shrink-0">
        <ProductImage size="sm" tag={p.tag} swatch={p.swatch} imageUrl={p.imageUrl} />
      </div>
      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
        <div className="text-[10.5px] text-muted font-mono tracking-[0.3px]">{p.sku}</div>
        <div className="text-sm font-semibold text-ink leading-tight">{p.title}</div>
        <div className="text-[11.5px] text-muted">{p.sub}</div>
        <StockPill stock={p.stock} eta={p.eta} />
        <div className="flex items-end justify-between mt-0.5">
          <PriceBlock p={p} mode={mode} size="sm" />
          <button
            onClick={handleAdd}
            disabled={state === 'loading'}
            className="w-9 h-9 rounded-[10px] text-white grid place-items-center cursor-pointer shrink-0 transition-colors"
            style={{ background: state === 'done' ? '#2d7a4a' : '#1a1a1a', opacity: state === 'loading' ? 0.6 : 1 }}
          >
            {state === 'done' ? (
              <svg width="16" height="16" viewBox="0 0 16 16">
                <path d="M3 8l4 4 6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16">
                <path d="M8 3v10M3 8h10" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
