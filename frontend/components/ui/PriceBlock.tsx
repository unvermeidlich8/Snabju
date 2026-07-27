import type { Product, Mode } from '@/lib/types';
import { fmtPlain } from '@/lib/format';

interface PriceBlockProps {
  p: Product;
  mode: Mode;
  size?: 'sm' | 'md' | 'lg';
}

export function PriceBlock({ p, mode, size = 'md' }: PriceBlockProps) {
  const big = size === 'lg';
  const isB2b = mode === 'b2b';

  const unitPrice = isB2b ? Math.round(p.price * 0.85) : p.price;
  const boxBasePrice = p.priceBox ?? (p.boxQty ? p.price * p.boxQty : null);
  const boxPrice = boxBasePrice != null && p.boxQty
    ? (isB2b ? Math.round(boxBasePrice * 0.85) : boxBasePrice)
    : null;

  return (
    <div className="flex flex-col gap-0.5">
      {/* Unit price */}
      <div className="flex items-baseline gap-2">
        <span className={`font-bold text-ink ${big ? 'text-2xl' : 'text-lg'}`} style={{ letterSpacing: '-0.4px' }}>
          {fmtPlain(unitPrice)} <span className="font-medium">₽</span>
        </span>
        {isB2b && (
          <span className="px-1.5 py-0.5 rounded-md text-[11px] font-bold" style={{ background: '#dcfce7', color: '#15803d' }}>−15%</span>
        )}
        {!isB2b && p.oldPrice && (
          <span className={`text-faint line-through ${big ? 'text-sm' : 'text-[13px]'}`}>
            {fmtPlain(p.oldPrice)}
          </span>
        )}
      </div>

      {/* Box price */}
      {boxPrice != null ? (
        <div className="text-[11px] text-muted">
          {fmtPlain(boxPrice)} ₽ / коробка · {p.boxQty} {p.unit}
        </div>
      ) : (
        <div className="text-[11px] text-muted">{p.unitDetail || `за ${p.unit}`}</div>
      )}

      {/* B2B: show crossed retail price */}
      {isB2b && (
        <div className="text-[11px] text-faint line-through">{fmtPlain(p.price)} ₽ розница</div>
      )}
    </div>
  );
}
