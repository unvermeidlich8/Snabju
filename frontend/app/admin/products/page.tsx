'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { fmt } from '@/lib/format';
import type { Product } from '@/lib/types';

type SortKey = 'title' | 'price' | 'stock' | 'date';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'title', label: 'Название' },
  { key: 'price', label: 'Цена' },
  { key: 'stock', label: 'Остаток' },
  { key: 'date',  label: 'Дата' },
];

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // multi-select
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  // inline stock edit
  const [editingStock, setEditingStock] = useState<string | null>(null);
  const [stockVal, setStockVal] = useState('');

  // inline image change
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  // delete confirm
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.adminListProducts();
      setProducts(res.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Clear selection when filter changes
  useEffect(() => { setSelected(new Set()); }, [query, sort, sortDir]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    let list = q
      ? products.filter(p => p.title.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.catLabel.toLowerCase().includes(q))
      : [...products];

    list.sort((a, b) => {
      let v = 0;
      if (sort === 'title') v = a.title.localeCompare(b.title, 'ru');
      else if (sort === 'price') v = a.price - b.price;
      else if (sort === 'stock') v = a.stock - b.stock;
      return sortDir === 'asc' ? v : -v;
    });
    return list;
  }, [products, query, sort, sortDir]);

  const filteredIds = useMemo(() => new Set(filtered.map(p => p.id)), [filtered]);
  const allSelected = filtered.length > 0 && filtered.every(p => selected.has(p.id));
  const someSelected = selected.size > 0;

  const toggleAll = () => {
    if (allSelected) {
      setSelected(prev => {
        const next = new Set(prev);
        filteredIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelected(prev => new Set([...prev, ...filteredIds]));
    }
  };

  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSort = (key: SortKey) => {
    if (sort === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSort(key); setSortDir('desc'); }
  };

  const saveStock = async (p: Product) => {
    const n = parseInt(stockVal, 10);
    if (isNaN(n) || n < 0) { setEditingStock(null); return; }
    try {
      const updated = await api.adminUpdateProduct(p.id, {
        title: p.title, sub: p.sub, category_id: p.categoryId || undefined,
        unit: p.unit, price: p.price, price_box: p.priceBox, box_qty: p.boxQty,
        stock: n, stock_unit: p.stockUnit, tag: p.tag ?? undefined,
        image_url: p.imageUrl,
        specs: p.specs,
      });
      setProducts(prev => prev.map(x => x.id === p.id ? updated : x));
    } catch {}
    setEditingStock(null);
  };

  const handleImageUpload = async (productId: string, file: File) => {
    setUploadingFor(productId);
    try {
      const url = await api.adminUpload(file);
      const p = products.find(x => x.id === productId)!;
      const updated = await api.adminUpdateProduct(productId, {
        title: p.title, sub: p.sub, category_id: p.categoryId || undefined,
        unit: p.unit, price: p.price, price_box: p.priceBox, box_qty: p.boxQty,
        stock: p.stock, stock_unit: p.stockUnit, tag: p.tag ?? undefined,
        image_url: url,
        specs: p.specs,
      });
      setProducts(prev => prev.map(x => x.id === productId ? updated : x));
    } catch {}
    setUploadingFor(null);
  };

  const toggleActive = async (p: Product) => {
    try {
      const updated = await api.adminUpdateProduct(p.id, {
        title: p.title, sub: p.sub, category_id: p.categoryId || undefined,
        unit: p.unit, price: p.price, price_box: p.priceBox, box_qty: p.boxQty,
        stock: p.stock, stock_unit: p.stockUnit, tag: p.tag ?? undefined,
        image_url: p.imageUrl, is_active: !p.isActive, specs: p.specs,
      });
      setProducts(prev => prev.map(x => x.id === p.id ? updated : x));
    } catch {}
  };

  const handleDelete = async (id: string) => {
    try {
      await api.adminDeleteProduct(id);
      setProducts(prev => prev.filter(x => x.id !== id));
      setSelected(prev => { const next = new Set(prev); next.delete(id); return next; });
    } catch {}
    setDeletingId(null);
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    const ids = [...selected];
    await Promise.allSettled(ids.map(id => api.adminDeleteProduct(id)));
    setProducts(prev => prev.filter(x => !selected.has(x.id)));
    setSelected(new Set());
    setBulkDeleting(false);
    setConfirmBulkDelete(false);
  };

  const SortBtn = ({ k }: { k: SortKey }) => (
    <button
      onClick={() => toggleSort(k)}
      className="flex items-center gap-1 text-[11px] font-semibold cursor-pointer select-none"
      style={{ color: sort === k ? '#ff6a13' : '#7a756d' }}
    >
      {SORT_OPTIONS.find(o => o.key === k)!.label}
      {sort === k && <span style={{ fontSize: 9 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>}
    </button>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-ink m-0" style={{ letterSpacing: '-0.5px' }}>
          Товары
          {!loading && <span className="ml-2 text-base font-normal text-muted">{filtered.length}</span>}
        </h1>
        <button
          onClick={() => router.push('/admin/products/new')}
          className="px-4 py-2 rounded-xl text-[13px] font-bold text-white cursor-pointer"
          style={{ background: '#ff6a13' }}
        >
          + Добавить
        </button>
      </div>

      {/* Search */}
      <div className="bg-white border border-divider rounded-xl px-3.5 py-2.5 flex items-center gap-2.5">
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <circle cx="6.5" cy="6.5" r="4.5" stroke="#a8a39a" strokeWidth="1.5"/>
          <path d="M10 10l3 3" stroke="#a8a39a" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input
          className="flex-1 text-sm text-ink font-medium bg-transparent outline-none placeholder:text-muted"
          placeholder="Поиск по названию, SKU, категории…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        {query && (
          <button onClick={() => setQuery('')} className="text-muted text-lg leading-none cursor-pointer">×</button>
        )}
      </div>

      {/* Sort bar + select all */}
      <div className="flex items-center gap-4 px-1">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={allSelected}
            ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
            onChange={toggleAll}
            className="w-4 h-4 accent-orange-500 cursor-pointer"
          />
          <span className="text-[11px] text-muted">Все</span>
        </label>
        <span className="text-[11px] text-muted">Сортировка:</span>
        {SORT_OPTIONS.map(o => <SortBtn key={o.key} k={o.key} />)}
      </div>

      {/* Bulk action bar */}
      {someSelected && (
        <div className="flex items-center justify-between bg-ink text-white px-4 py-2.5 rounded-xl">
          <span className="text-[13px] font-semibold">
            Выбрано: {selected.size}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelected(new Set())}
              className="text-[12px] cursor-pointer"
              style={{ color: 'rgba(255,255,255,0.6)' }}
            >
              Снять выделение
            </button>
            <button
              onClick={() => setConfirmBulkDelete(true)}
              className="px-3 py-1.5 rounded-lg text-[12px] font-bold cursor-pointer bg-red-500 text-white"
            >
              Удалить выбранные
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="py-12 text-center text-sm text-muted">Загружаем товары…</div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted">Ничего не найдено</div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(p => (
            <div
              key={p.id}
              className="bg-white border rounded-[14px] p-3 flex items-center gap-3 transition-colors"
              style={{ borderColor: selected.has(p.id) ? '#ff6a13' : '#e8e3d8' }}
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={selected.has(p.id)}
                onChange={() => toggleOne(p.id)}
                className="w-4 h-4 shrink-0 accent-orange-500 cursor-pointer"
              />

              {/* Image */}
              <div className="relative shrink-0">
                <div
                  className="w-14 h-14 rounded-xl overflow-hidden"
                  style={{ background: p.swatch }}
                >
                  {p.imageUrl
                    ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full" style={{ backgroundImage: 'repeating-linear-gradient(135deg, transparent 0 6px, rgba(0,0,0,0.04) 6px 7px)' }} />
                  }
                  {uploadingFor === p.id && (
                    <div className="absolute inset-0 bg-white/70 grid place-items-center">
                      <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <label
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-ink grid place-items-center cursor-pointer"
                  title="Сменить фото"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1 7.5V9h1.5L7.5 4l-1.5-1.5L1 7.5zM8.8 2.7a.4.4 0 000-.57L7.87 1.2a.4.4 0 00-.57 0l-.73.73 1.5 1.5.73-.73z" fill="#fff"/>
                  </svg>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(p.id, f); e.target.value = ''; }}
                  />
                </label>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-muted font-mono">{p.sku} · {p.catLabel}</div>
                <div className="text-sm font-semibold text-ink leading-tight truncate">{p.title}</div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[13px] font-bold text-ink font-mono">{fmt(p.price)}</span>
                  {p.priceBox && (
                    <span className="text-[11px] text-muted">кор. {fmt(p.priceBox)}</span>
                  )}
                </div>
              </div>

              {/* Stock */}
              <div className="shrink-0 text-right">
                <div className="text-[10px] text-muted mb-0.5">Остаток</div>
                {editingStock === p.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      autoFocus
                      type="number"
                      min={0}
                      className="w-16 text-sm font-bold font-mono text-ink bg-white border border-divider rounded-lg px-2 py-1 outline-none"
                      value={stockVal}
                      onChange={e => setStockVal(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveStock(p); if (e.key === 'Escape') setEditingStock(null); }}
                      onBlur={() => saveStock(p)}
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditingStock(p.id); setStockVal(String(p.stock)); }}
                    className="text-sm font-bold font-mono cursor-pointer px-2 py-1 rounded-lg hover:bg-brand transition-colors"
                    style={{ color: p.stock > 0 ? '#1a1a1a' : '#e85d0a' }}
                    title="Нажмите чтобы изменить"
                  >
                    {p.stock} {p.stockUnit}
                  </button>
                )}
              </div>

              {/* Active toggle */}
              <div className="shrink-0 flex flex-col items-center gap-1">
                <button
                  onClick={() => toggleActive(p)}
                  className="relative w-10 h-5 rounded-full transition-colors cursor-pointer"
                  style={{ background: p.isActive ? '#22c55e' : '#d1d5db' }}
                  title={p.isActive ? 'Скрыть товар' : 'Показать товар'}
                >
                  <div
                    className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all"
                    style={{ left: p.isActive ? '22px' : '2px' }}
                  />
                </button>
                <div className="text-[9px] font-mono" style={{ color: p.isActive ? '#15803d' : '#9ca3af' }}>
                  {p.isActive ? 'продаётся' : 'скрыт'}
                </div>
              </div>

              {/* Actions */}
              <div className="shrink-0 flex flex-col gap-1.5">
                <button
                  onClick={() => router.push(`/admin/products/${p.id}/edit`)}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-semibold cursor-pointer border border-divider bg-white text-ink"
                >
                  Изменить
                </button>
                <button
                  onClick={() => setDeletingId(p.id)}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-semibold cursor-pointer border border-red-100 bg-red-50 text-red-500"
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Single delete confirm modal */}
      {deletingId && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setDeletingId(null)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-white rounded-[20px] p-6 max-w-sm mx-auto shadow-xl">
            <h3 className="text-lg font-bold text-ink m-0 mb-2">Удалить товар?</h3>
            <p className="text-sm text-muted mb-5">
              {products.find(x => x.id === deletingId)?.title}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2.5 rounded-xl text-[14px] font-semibold border border-divider bg-white text-ink cursor-pointer"
              >
                Отмена
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="flex-1 py-2.5 rounded-xl text-[14px] font-bold bg-red-500 text-white cursor-pointer"
              >
                Удалить
              </button>
            </div>
          </div>
        </>
      )}

      {/* Bulk delete confirm modal */}
      {confirmBulkDelete && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => !bulkDeleting && setConfirmBulkDelete(false)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-white rounded-[20px] p-6 max-w-sm mx-auto shadow-xl">
            <h3 className="text-lg font-bold text-ink m-0 mb-2">Удалить {selected.size} товар{selected.size === 1 ? '' : selected.size < 5 ? 'а' : 'ов'}?</h3>
            <p className="text-sm text-muted mb-5">Это действие необратимо.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmBulkDelete(false)}
                disabled={bulkDeleting}
                className="flex-1 py-2.5 rounded-xl text-[14px] font-semibold border border-divider bg-white text-ink cursor-pointer disabled:opacity-50"
              >
                Отмена
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="flex-1 py-2.5 rounded-xl text-[14px] font-bold bg-red-500 text-white cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {bulkDeleting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Удалить
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
