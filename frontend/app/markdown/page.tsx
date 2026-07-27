'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { fmt } from '@/lib/format';
import { useCart } from '@/providers/CartProvider';
import type { MarkdownItem, Product } from '@/lib/types';

export default function MarkdownPage() {
  const { addMarkdownToCart } = useCart();
  const [items, setItems] = useState<MarkdownItem[]>([]);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [markdownData, productData] = await Promise.all([
          api.getMarkdownItems(),
          api.getProducts({ limit: 500 }),
        ]);
        const map: Record<string, Product> = {};
        productData.items.forEach(p => { map[p.id] = p; });
        setProducts(map);
        setItems(markdownData);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleAdd = async (m: MarkdownItem) => {
    setAdding(m.id);
    try {
      await addMarkdownToCart(m.id, 1);
    } finally {
      setAdding(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold text-ink m-0" style={{ letterSpacing: '-0.5px' }}>
        Уценка
        {!loading && <span className="ml-2 text-base font-normal text-muted">{items.length}</span>}
      </h1>
      <p className="text-sm text-muted -mt-2">
        Отдельные единицы товаров со скидкой. Цена действует только на указанное количество.
      </p>

      {loading ? (
        <div className="py-12 text-center text-sm text-muted">Загрузка…</div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted">Уценённых товаров сейчас нет</div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map(m => {
            const p = products[m.productId];
            const discount = p ? Math.round((1 - m.price / p.price) * 100) : 0;
            return (
              <div key={m.id} className="bg-white border border-divider rounded-2xl p-4 flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0" style={{ background: p?.swatch ?? '#e8e3d8' }}>
                  {p?.imageUrl && <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-muted font-mono">{p?.sku} · {p?.catLabel}</div>
                  <div className="text-sm font-semibold text-ink leading-tight">{p?.title ?? '—'}</div>
                  {m.reason && (
                    <div className="text-[11px] mt-0.5 px-2 py-0.5 rounded-full inline-block" style={{ background: '#fff3e0', color: '#e65100' }}>
                      {m.reason}
                    </div>
                  )}
                  <div className="text-[11px] text-muted mt-1">Осталось: {m.qty} шт</div>
                </div>

                <div className="shrink-0 text-right flex flex-col items-end gap-2">
                  <div>
                    <div className="text-lg font-extrabold font-mono" style={{ color: '#ff6a13' }}>{fmt(m.price)}</div>
                    {p && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12px] text-muted line-through">{fmt(p.price)}</span>
                        {discount > 0 && (
                          <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">−{discount}%</span>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleAdd(m)}
                    disabled={adding === m.id}
                    className="px-4 py-2 rounded-xl text-[13px] font-bold text-white cursor-pointer disabled:opacity-60 flex items-center gap-2"
                    style={{ background: '#ff6a13' }}
                  >
                    {adding === m.id && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    В корзину
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
