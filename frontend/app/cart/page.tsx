'use client';

import { useRouter } from 'next/navigation';
import { useMode } from '@/providers/ModeProvider';
import { useCart } from '@/providers/CartProvider';
import { ModeChip } from '@/components/ui/ModeChip';
import { ProductImage } from '@/components/ui/ProductImage';
import { QtyStepper } from '@/components/ui/QtyStepper';
import { Btn } from '@/components/ui/Btn';
import { fmt } from '@/lib/format';

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between text-[13px]">
      <span className="text-muted">{label}</span>
      <span className={`font-semibold ${accent ? 'text-success' : 'text-ink2'}`}>{value}</span>
    </div>
  );
}

export default function CartPage() {
  const router = useRouter();
  const { mode } = useMode();
  const { items, loading, updateQty, removeFromCart } = useCart();

  const itemPrice = (it: typeof items[0]) => {
    if (it.markdownPrice != null) return it.markdownPrice;
    const base = it.product.price;
    return mode === 'b2b' ? Math.round(base * 0.85) : base;
  };

  const subtotal = items.reduce((s, it) => s + itemPrice(it) * it.qty, 0);
  const total = subtotal;

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-16 text-center text-sm text-muted">
        Загружаем корзину…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-8 pt-16 text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-accent-soft grid place-items-center">
          <svg width="40" height="40" viewBox="0 0 22 22">
            <path d="M3 4h2l2 11h11l2-8H6" fill="none" stroke="#ff6a13" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="9" cy="19" r="1.5" fill="none" stroke="#ff6a13" strokeWidth="1.6"/>
            <circle cx="17" cy="19" r="1.5" fill="none" stroke="#ff6a13" strokeWidth="1.6"/>
          </svg>
        </div>
        <h2 className="text-[22px] font-bold text-ink m-0" style={{ letterSpacing: '-0.4px' }}>Корзина пуста</h2>
        <p className="mt-1.5 mb-4 text-sm text-muted">
          Загляните в каталог — там пены, герметики и многое другое.
        </p>
        <Btn kind="primary" onClick={() => router.push('/catalog')}>В каталог</Btn>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="px-4 pt-4 pb-1.5 flex items-center justify-between">
        <div>
          <h1 className="m-0 text-[26px] font-extrabold text-ink" style={{ letterSpacing: '-0.6px' }}>Корзина</h1>
          <div className="text-xs text-muted mt-0.5">
            {items.length} {items.length === 1 ? 'позиция' : 'позиции'} · {items.reduce((s, i) => s + i.qty, 0)} ед.
          </div>
        </div>
        <ModeChip />
      </div>

      {/* Items */}
      <div className="px-4 pt-3 flex flex-col gap-2.5">
        {items.map(it => (
          <div key={it.id} className="bg-white border rounded-[14px] p-3 flex gap-3" style={{ borderColor: it.markdownPrice != null ? '#fed7aa' : '#e8e3d8' }}>
            <div className="w-[76px] shrink-0">
              <ProductImage size="sm" swatch={it.product.swatch} imageUrl={it.product.imageUrl} />
            </div>
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10.5px] text-muted font-mono">{it.product.sku}</span>
                {it.markdownPrice != null && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#fff3e0', color: '#e65100' }}>Уценка</span>
                )}
              </div>
              <div className="text-[13px] font-semibold text-ink leading-tight">{it.product.title}</div>
              <div className="text-[11px] text-muted">{it.product.eta}</div>
              <div className="flex items-center justify-between mt-1">
                <QtyStepper value={it.qty} onChange={v => updateQty(it.id, v)} />
                <div className="text-right">
                  <div className="text-sm font-bold text-ink font-mono">
                    {fmt(itemPrice(it) * it.qty)}
                  </div>
                  {it.markdownPrice != null && (
                    <div className="text-[10px] text-muted line-through">{fmt(it.product.price * it.qty)}</div>
                  )}
                </div>
              </div>
            </div>
            <button onClick={() => removeFromCart(it.id)} className="self-start text-faint text-lg p-1 cursor-pointer">×</button>
          </div>
        ))}
      </div>

      {/* Promo */}
      <div className="px-4 pt-3.5">
        <div className="bg-white rounded-xl px-3.5 py-2.5 flex items-center gap-2.5" style={{ border: '1px dashed #e7e3da' }}>
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M2 6l5-5 7 7-5 5L2 6z" fill="none" stroke="#7a756d" strokeWidth="1.4"/>
            <circle cx="6" cy="6" r="1" fill="#7a756d"/>
          </svg>
          <span className="text-[13px] text-muted flex-1">Промокод или бонусы</span>
          <span className="text-[13px] font-semibold text-accent">+</span>
        </div>
      </div>

      {/* Summary */}
      <div className="px-4 pt-3.5">
        <div className="bg-white border border-divider rounded-[14px] p-3.5 flex flex-col gap-2">
          <Row label="Товары" value={fmt(subtotal)} />
          <div className="h-px bg-divider my-1" />
          <div className="flex justify-between items-baseline">
            <span className="text-base font-bold text-ink">Итого</span>
            <span className="text-[22px] font-extrabold text-ink font-mono" style={{ letterSpacing: '-0.4px' }}>{fmt(total)}</span>
          </div>
        </div>
      </div>

      <div className="px-4 pt-3.5 pb-6">
        <Btn full size="lg" onClick={() => router.push('/checkout')}>Оформить заказ →</Btn>
      </div>
    </div>
  );
}
