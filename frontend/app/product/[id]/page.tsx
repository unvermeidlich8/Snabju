'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useMode } from '@/providers/ModeProvider';
import { useCart } from '@/providers/CartProvider';
import { ProductImage } from '@/components/ui/ProductImage';
import { PriceBlock } from '@/components/ui/PriceBlock';
import { StockPill } from '@/components/ui/StockPill';
import { QtyStepper } from '@/components/ui/QtyStepper';
import { ProductCardSmall } from '@/components/cards/ProductCardSmall';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { fmt } from '@/lib/format';
import type { Mode, Product } from '@/lib/types';

export default function ProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { mode } = useMode();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [similar, setSimilar] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'about' | 'specs' | 'docs'>('about');
  const [qty, setQty] = useState(1);
  const [asPallet, setAsPallet] = useState(false);

  useEffect(() => {
    api.getProduct(params.id).then(p => {
      setProduct(p);
      setQty(mode === 'b2b' ? (p.boxQty || 1) : 1);
      setAsPallet(mode === 'b2b');
      return api.getProducts({ category_id: p.categoryId, limit: 6 });
    }).then(res => {
      setSimilar(res.items.filter(x => x.id !== params.id).slice(0, 4));
    }).catch(() => {});
  }, [params.id, mode]);

  if (!product) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-16 text-center text-sm text-muted">
        Загружаем товар…
      </div>
    );
  }

  const p = product;
  const unitPrice = asPallet ? (p.priceBox ?? p.price) : p.price;
  const total = unitPrice * qty;
  const effectiveMode: Mode = asPallet ? 'b2b' : 'b2c';

  return (
    <div className="max-w-2xl mx-auto relative">
      {/* Floating top bar */}
      <div className="absolute top-14 left-0 right-0 z-10 px-4 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl grid place-items-center cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M9 2L3 7l6 5" fill="none" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="flex gap-2">
          {[
            <svg key="heart" width="16" height="16" viewBox="0 0 16 16"><path d="M8 14l-1-.9C3.5 9.9 1 7.7 1 5a3.6 3.6 0 016.5-2.1A3.6 3.6 0 0115 5c0 2.7-2.5 4.9-6 8.1L8 14z" fill="none" stroke="#1a1a1a" strokeWidth="1.5"/></svg>,
            <svg key="share" width="14" height="14" viewBox="0 0 14 14"><circle cx="11" cy="3" r="1.5" fill="#1a1a1a"/><circle cx="3" cy="7" r="1.5" fill="#1a1a1a"/><circle cx="11" cy="11" r="1.5" fill="#1a1a1a"/><path d="M4.3 6.3l5.4-2.6M4.3 7.7l5.4 2.6" stroke="#1a1a1a" strokeWidth="1.2"/></svg>,
          ].map((icon, i) => (
            <button key={i} className="w-9 h-9 rounded-xl grid place-items-center cursor-pointer" style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
              {icon}
            </button>
          ))}
        </div>
      </div>

      <div className="pb-28">
        {/* Hero image */}
        <div className="pt-14 relative">
          <ProductImage size="lg" tag={p.tag} swatch={p.swatch} />
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="h-1.5 rounded-sm" style={{ width: i === 0 ? 18 : 6, background: i === 0 ? '#1a1a1a' : 'rgba(0,0,0,0.2)' }} />
            ))}
          </div>
        </div>

        {/* Title block */}
        <div className="px-4 pt-4">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] text-muted font-mono">{p.sku}</span>
            <span className="text-[11px] text-faint">·</span>
            <span className="text-[11px] text-muted">{p.catLabel}</span>
            <span className="ml-auto text-xs text-ink2 font-semibold">
              ★ {p.rating} <span className="text-muted font-normal">({p.reviews})</span>
            </span>
          </div>
          <h1 className="m-0 text-[22px] font-bold text-ink leading-tight" style={{ letterSpacing: '-0.5px' }}>{p.title}</h1>
          <p className="mt-1.5 mb-0 text-[13px] text-muted">{p.sub}</p>
        </div>

        {/* B2B pallet toggle */}
        {mode === 'b2b' && (
          <div className="px-4 pt-3.5">
            <div className="bg-white border border-divider rounded-xl p-1 flex">
              {[['Розница', false], ['Паллета', true]].map(([label, val]) => (
                <button
                  key={String(label)}
                  onClick={() => { setAsPallet(val as boolean); setQty(1); }}
                  className="flex-1 text-center py-2 rounded-[9px] text-[13px] font-semibold cursor-pointer"
                  style={{ background: asPallet === val ? '#1a1a1a' : 'transparent', color: asPallet === val ? '#fff' : '#3c3833' }}
                >
                  {label as string}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Price + stock card */}
        <div className="px-4 pt-3.5">
          <div className="bg-white border border-divider rounded-[16px] p-4 flex flex-col gap-3">
            <div className="flex items-end justify-between">
              <PriceBlock p={p} mode={effectiveMode} size="lg" />
              {mode === 'b2b' && (
                <div className="px-2 py-1 rounded-[6px] bg-success-soft text-success text-[11px] font-bold font-mono">−9%</div>
              )}
            </div>
            <div className="h-px bg-divider" />
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <StockPill stock={p.stock} eta={p.eta} />
                <div className="text-xs text-muted mt-1">
                  На складе: <b className="text-ink2 font-semibold">{p.stock} {p.stockUnit}</b>
                </div>
              </div>
              <QtyStepper value={qty} onChange={setQty} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 pt-5">
          <div className="flex gap-1.5 border-b border-divider">
            {([['about', 'Описание'], ['specs', 'Характеристики'], ['docs', 'Документы']] as const).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="px-3 py-2.5 text-[13px] font-semibold cursor-pointer"
                style={{ color: activeTab === id ? '#1a1a1a' : '#7a756d', borderBottom: `2px solid ${activeTab === id ? '#ff6a13' : 'transparent'}`, marginBottom: -1 }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'about' && (
          <div className="px-4 pt-3.5">
            <p className="m-0 text-sm leading-relaxed text-ink2">
              {p.sub || 'Описание товара отсутствует.'}
            </p>
          </div>
        )}

        {activeTab === 'specs' && (
          <div className="px-4 pt-3.5">
            {p.specs.length > 0 ? (
              <div className="bg-white border border-divider rounded-xl overflow-hidden">
                {p.specs.map((s, i) => (
                  <div key={s.key} className="flex justify-between px-3.5 py-3" style={{ borderTop: i ? '1px solid #e7e3da' : 'none' }}>
                    <span className="text-[13px] text-muted">{s.key}</span>
                    <span className="text-[13px] font-semibold text-ink font-mono">{s.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">Характеристики не указаны</p>
            )}
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="px-4 pt-3.5 flex flex-col gap-2">
            {['Сертификат соответствия.pdf', 'Технический лист.pdf', 'Декларация ПБ.pdf'].map(f => (
              <div key={f} className="flex items-center gap-3 bg-white border border-divider rounded-xl p-3">
                <div className="w-9 h-9 rounded-lg bg-brand grid place-items-center font-mono text-[10px] font-bold text-accent-dk shrink-0">PDF</div>
                <div className="flex-1 text-[13px] font-medium text-ink">{f}</div>
                <svg width="14" height="14" viewBox="0 0 14 14">
                  <path d="M7 1v9M3 7l4 4 4-4M2 13h10" stroke="#a8a39a" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            ))}
          </div>
        )}

        {/* Similar */}
        {similar.length > 0 && (
          <div className="pt-6">
            <SectionHeader title="Похожие товары" />
            <div className="flex gap-3 overflow-x-auto px-4 scrollbar-hide">
              {similar.map(s => (
                <div key={s.id} className="shrink-0 w-[180px]">
                  <ProductCardSmall
                    p={s}
                    mode={mode}
                    onClick={() => router.push(`/product/${s.id}`)}
                    onAddToCart={() => addToCart(s.id, 1)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky bottom CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 px-4 py-3 flex items-center gap-2.5 border-t border-divider"
        style={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(20px) saturate(180%)', paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        <div className="flex-1">
          <div className="text-[11px] text-muted">Итого {qty} {asPallet ? 'коробок' : p.unit}</div>
          <div className="text-[18px] font-bold text-ink font-mono" style={{ letterSpacing: '-0.3px' }}>{fmt(total)}</div>
        </div>
        <button
          onClick={() => { addToCart(p.id, qty, asPallet); router.push('/cart'); }}
          className="px-[22px] py-3.5 rounded-xl text-[15px] font-bold text-white cursor-pointer"
          style={{ background: '#ff6a13' }}
        >
          В корзину →
        </button>
      </div>
    </div>
  );
}
