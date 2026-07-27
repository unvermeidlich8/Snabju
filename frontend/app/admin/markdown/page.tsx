'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { fmt } from '@/lib/format';
import type { MarkdownItem, Product } from '@/lib/types';

export default function AdminMarkdownPage() {
  const [items, setItems] = useState<MarkdownItem[]>([]);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(true);

  // form
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState('');
  const [price, setPrice] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // delete
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [markdownData, productData] = await Promise.all([
        api.getMarkdownItems(),
        api.getProducts({ limit: 500 }),
      ]);
      setItems(markdownData);
      setAllProducts(productData.items);
      const map: Record<string, Product> = {};
      productData.items.forEach(p => { map[p.id] = p; });
      setProducts(map);
      if (!productId && productData.items.length > 0) {
        setProductId(productData.items[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const qtyNum = parseInt(qty, 10);
    const priceNum = parseFloat(price);
    if (!productId || isNaN(qtyNum) || qtyNum <= 0 || isNaN(priceNum) || priceNum <= 0) {
      setError('Заполните все поля корректно');
      return;
    }
    setSaving(true);
    try {
      const created = await api.adminCreateMarkdown({
        product_id: productId,
        qty: qtyNum,
        price: priceNum,
        reason: reason.trim() || undefined,
      });
      setItems(prev => [created, ...prev]);
      setQty('');
      setPrice('');
      setReason('');
    } catch (e: any) {
      setError(e.message ?? 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.adminDeleteMarkdown(id);
      setItems(prev => prev.filter(x => x.id !== id));
    } catch {}
    setDeletingId(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold text-ink m-0" style={{ letterSpacing: '-0.5px' }}>
        Уценка
        {!loading && <span className="ml-2 text-base font-normal text-muted">{items.length}</span>}
      </h1>

      {/* Create form */}
      <form onSubmit={handleCreate} className="bg-white border border-divider rounded-2xl p-5 flex flex-col gap-4">
        <div className="text-[11px] font-mono uppercase tracking-[0.4px] text-muted">Добавить уценённую партию</div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-muted">Товар</label>
          <select
            className="w-full border border-divider rounded-xl px-3 py-2.5 text-sm text-ink bg-white outline-none"
            value={productId}
            onChange={e => setProductId(e.target.value)}
          >
            {allProducts.map(p => (
              <option key={p.id} value={p.id}>{p.title} ({p.sku})</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-muted">Количество, шт</label>
            <input
              type="number" min={1}
              className="border border-divider rounded-xl px-3 py-2.5 text-sm text-ink outline-none"
              placeholder="1"
              value={qty}
              onChange={e => setQty(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-muted">Цена за шт, ₽</label>
            <input
              type="number" min={1} step="0.01"
              className="border border-divider rounded-xl px-3 py-2.5 text-sm text-ink outline-none"
              placeholder="0"
              value={price}
              onChange={e => setPrice(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-muted">Причина (необязательно)</label>
          <input
            type="text"
            className="border border-divider rounded-xl px-3 py-2.5 text-sm text-ink outline-none"
            placeholder="Вскрытая упаковка, царапина и т.д."
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
        </div>

        {error && <div className="text-sm text-red-500">{error}</div>}

        <button
          type="submit"
          disabled={saving}
          className="py-2.5 rounded-xl text-[14px] font-bold text-white cursor-pointer disabled:opacity-60"
          style={{ background: '#ff6a13' }}
        >
          {saving ? 'Сохраняем…' : 'Добавить партию'}
        </button>
      </form>

      {/* List */}
      {loading ? (
        <div className="py-8 text-center text-sm text-muted">Загрузка…</div>
      ) : items.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted">Уценённых товаров нет</div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map(m => {
            const p = products[m.productId];
            return (
              <div key={m.id} className="bg-white border border-divider rounded-[14px] p-4 flex items-center gap-4">
                {p?.imageUrl && (
                  <img src={p.imageUrl} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" style={{ background: p?.swatch }} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-muted font-mono">{p?.sku ?? m.productId}</div>
                  <div className="text-sm font-semibold text-ink truncate">{p?.title ?? '—'}</div>
                  {m.reason && (
                    <div className="text-[11px] text-muted mt-0.5">{m.reason}</div>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[11px] text-muted">Остаток</div>
                  <div className="text-sm font-bold font-mono text-ink">{m.qty} шт</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[11px] text-muted">Цена</div>
                  <div className="text-sm font-bold font-mono" style={{ color: '#ff6a13' }}>{fmt(m.price)}</div>
                  {p && (
                    <div className="text-[10px] text-muted line-through">{fmt(p.price)}</div>
                  )}
                </div>
                <button
                  onClick={() => setDeletingId(m.id)}
                  className="shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-semibold cursor-pointer border border-red-100 bg-red-50 text-red-500"
                >
                  Удалить
                </button>
              </div>
            );
          })}
        </div>
      )}

      {deletingId && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setDeletingId(null)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-white rounded-[20px] p-6 max-w-sm mx-auto shadow-xl">
            <h3 className="text-lg font-bold text-ink m-0 mb-2">Удалить партию?</h3>
            <p className="text-sm text-muted mb-5">Записи в корзинах, ссылающиеся на эту партию, потеряют цену уценки.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeletingId(null)} className="flex-1 py-2.5 rounded-xl text-[14px] font-semibold border border-divider bg-white text-ink cursor-pointer">
                Отмена
              </button>
              <button onClick={() => handleDelete(deletingId)} className="flex-1 py-2.5 rounded-xl text-[14px] font-bold bg-red-500 text-white cursor-pointer">
                Удалить
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
