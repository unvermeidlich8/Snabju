import type { Product, Mode } from '@/lib/types';
import { fmtPlain } from '@/lib/format';

interface PriceBlockProps {
  p: Product;
  mode: Mode;
  size?: 'sm' | 'md' | 'lg';
}

export function PriceBlock({ p, mode, size = 'md' }: PriceBlockProps) {
  const big = size === 'lg';

  if (mode === 'b2b') {
    return (
      <div className="flex flex-col gap-0.5">
        <div className="flex items-baseline gap-1.5">
          <span className={`font-bold text-ink ${big ? 'text-2xl' : 'text-lg'}`} style={{ letterSpacing: '-0.4px' }}>
            {fmtPlain(p.priceBox ?? p.price)}
          </span>
          <span className={`text-muted ${big ? 'text-sm' : 'text-xs'}`}>₽ / коробка</span>
        </div>
        <div className="text-[11px] font-mono text-muted">
          {p.boxQty} {p.unit} · {fmtPlain(Math.round((p.priceBox ?? p.price) / (p.boxQty || 1)))} ₽/{p.unit}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-baseline gap-2">
        <span className={`font-bold text-ink ${big ? 'text-2xl' : 'text-lg'}`} style={{ letterSpacing: '-0.4px' }}>
          {fmtPlain(p.price)} <span className="font-medium">₽</span>
        </span>
        {p.oldPrice && (
          <span className={`text-faint line-through ${big ? 'text-sm' : 'text-[13px]'}`}>
            {fmtPlain(p.oldPrice)}
          </span>
        )}
      </div>
      <div className="text-[11px] text-muted">{p.unitDetail}</div>
    </div>
  );
}