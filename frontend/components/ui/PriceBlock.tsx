import type { Product } from '@/lib/types';
import { fmtPlain } from '@/lib/format';

interface PriceBlockProps {
  p: Product;
  isBox?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function PriceBlock({ p, isBox = false, size = 'md' }: PriceBlockProps) {
  const big = size === 'lg';
  const basePrice = isBox ? (p.priceBox ?? p.price) : p.price;
  const unitPrice = basePrice;
  const boxBasePrice = p.priceBox ?? (p.boxQty ? p.price * p.boxQty : null);
  const boxPrice = boxBasePrice != null && p.boxQty ? boxBasePrice : null;

  return (
    <div className="flex flex-col gap-0.5">
      {/* Unit price */}
      <div className="flex items-baseline gap-2">
        <span className={`font-bold text-ink ${big ? 'text-2xl' : 'text-lg'}`} style={{ letterSpacing: '-0.4px' }}>
          {fmtPlain(unitPrice)} <span className="font-medium">₽</span>
        </span>
        {p.oldPrice && (
          <span className={`text-faint line-through ${big ? 'text-sm' : 'text-[13px]'}`}>
            {fmtPlain(p.oldPrice)}
          </span>
        )}
      </div>

      {isBox ? (
        <div className="text-[11px] text-muted">
          {p.boxQty} {p.unit} в коробке · {fmtPlain(Math.round(unitPrice / p.boxQty))} ₽ / {p.unit}
        </div>
      ) : (
        <div className="text-[11px] text-muted">
          {boxPrice != null ? `${fmtPlain(boxPrice)} ₽ / коробка · ${p.boxQty} ${p.unit}` : (p.unitDetail || `за ${p.unit}`)}
        </div>
      )}

    </div>
  );
}
