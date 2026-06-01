'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import type { Category, Product, ProductTag, ProductUnit } from '@/lib/types';
import { ImageUpload } from '@/components/ui/ImageUpload';

const inputCls = 'w-full text-sm text-ink font-medium bg-transparent outline-none placeholder:text-muted';

function Field({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-divider rounded-xl p-3.5">
      <div className="text-[11px] text-muted font-mono uppercase tracking-[0.4px] mb-1.5">
        {label}{optional && <span className="normal-case"> · необязательно</span>}
      </div>
      {children}
    </div>
  );
}

const TAGS: { value: ProductTag; label: string }[] = [
  { value: null,      label: 'Нет' },
  { value: 'Хит',     label: 'Хит' },
  { value: 'Акция',   label: 'Акция' },
  { value: 'Новинка', label: 'Новинка' },
];

const UNITS: ProductUnit[] = ['уп', 'рул', 'шт', 'лист'];

export default function AdminEditProductPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [unit, setUnit] = useState<ProductUnit>('уп');
  const [price, setPrice] = useState('');
  const [priceBox, setPriceBox] = useState('');
  const [boxQty, setBoxQty] = useState('');
  const [stock, setStock] = useState('');
  const [stockUnit, setStockUnit] = useState('');
  const [tag, setTag] = useState<ProductTag>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
    api.getProduct(id).then(p => {
      setProduct(p);
      setTitle(p.title);
      setDescription(p.sub);
      setCategoryId(p.categoryId);
      setUnit((p.unit as ProductUnit) || 'уп');
      setPrice(String(p.price));
      setPriceBox(p.priceBox ? String(p.priceBox) : '');
      setBoxQty(p.boxQty ? String(p.boxQty) : '');
      setStock(String(p.stock));
      setStockUnit(p.stockUnit);
      setTag(p.tag);
      setImageUrl(p.imageUrl);
      setSpecs(p.specs.length > 0 ? p.specs : [{ key: '', value: '' }]);
    }).catch(() => router.replace('/admin/products'));
  }, [id]);

  const addSpec = () => setSpecs(prev => [...prev, { key: '', value: '' }]);
  const removeSpec = (i: number) => setSpecs(prev => prev.filter((_, idx) => idx !== i));
  const updateSpec = (i: number, field: 'key' | 'value', val: string) =>
    setSpecs(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));

  const handleSubmit = async () => {
    setError('');
    if (!title.trim()) { setError('Введите название'); return; }
    if (!price || Number(price) <= 0) { setError('Введите цену'); return; }
    if (priceBox && !boxQty) { setError('Укажите кол-во в коробке'); return; }

    setSaving(true);
    try {
      await api.adminUpdateProduct(id, {
        title: title.trim(),
        sub: description.trim(),
        category_id: categoryId || undefined,
        unit,
        price: Number(price),
        price_box: priceBox ? Number(priceBox) : null,
        box_qty: boxQty ? Number(boxQty) : 0,
        stock: stock ? Number(stock) : 0,
        stock_unit: stockUnit.trim(),
        tag: tag ?? undefined,
        image_url: imageUrl,
        specs: specs.filter(s => s.key.trim() && s.value.trim()),
      });
      router.push('/admin/products');
    } catch (e: any) {
      setError(e.message ?? 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  if (!product) {
    return <div className="py-12 text-center text-sm text-muted">Загрузка…</div>;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/admin/products')}
          className="w-8 h-8 bg-white border border-divider rounded-lg grid place-items-center cursor-pointer shrink-0"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M8 1L3 6l5 5" fill="none" stroke="#1a1a1a" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </button>
        <h1 className="text-xl font-extrabold text-ink m-0 truncate" style={{ letterSpacing: '-0.4px' }}>
          {product.title}
        </h1>
      </div>

      <div className="flex flex-col gap-3">
        <div className="text-[11px] text-muted font-mono uppercase tracking-[0.4px]">Основное</div>

        <Field label="Название">
          <input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} />
        </Field>

        <Field label="Описание" optional>
          <textarea className={inputCls + ' resize-none'} rows={3} value={description} onChange={e => setDescription(e.target.value)} />
        </Field>

        <Field label="Категория">
          <select className={inputCls} value={categoryId} onChange={e => setCategoryId(e.target.value)}>
            <option value="">— выбрать —</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </Field>
      </div>

      <div className="flex flex-col gap-3">
        <div className="text-[11px] text-muted font-mono uppercase tracking-[0.4px]">Единица продажи</div>
        <div className="flex gap-2">
          {UNITS.map(u => (
            <button key={u} onClick={() => setUnit(u)}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold border cursor-pointer"
              style={{ background: unit === u ? '#1a1a1a' : '#fff', color: unit === u ? '#fff' : '#3c3833', borderColor: unit === u ? '#1a1a1a' : '#e7e3da' }}
            >{u}</button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="text-[11px] text-muted font-mono uppercase tracking-[0.4px]">Цены</div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Цена, ₽">
            <input className={inputCls} type="number" min={0} value={price} onChange={e => setPrice(e.target.value)} />
          </Field>
          <Field label="Цена коробки, ₽" optional>
            <input className={inputCls} type="number" min={0} value={priceBox} onChange={e => setPriceBox(e.target.value)} />
          </Field>
          <Field label="Кол-во в коробке" optional>
            <input className={inputCls} type="number" min={0} value={boxQty} onChange={e => setBoxQty(e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="text-[11px] text-muted font-mono uppercase tracking-[0.4px]">Остаток</div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Количество">
            <input className={inputCls} type="number" min={0} value={stock} onChange={e => setStock(e.target.value)} />
          </Field>
          <Field label="Единица" optional>
            <input className={inputCls} placeholder="упаковок" value={stockUnit} onChange={e => setStockUnit(e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="text-[11px] text-muted font-mono uppercase tracking-[0.4px]">Метка</div>
        <div className="flex gap-2">
          {TAGS.map(t => (
            <button key={String(t.value)} onClick={() => setTag(t.value)}
              className="px-4 py-2 rounded-full text-[13px] font-medium border cursor-pointer"
              style={{ background: tag === t.value ? '#1a1a1a' : '#fff', color: tag === t.value ? '#fff' : '#3c3833', borderColor: tag === t.value ? '#1a1a1a' : '#e7e3da' }}
            >{t.label}</button>
          ))}
        </div>
      </div>

      <ImageUpload value={imageUrl} onChange={setImageUrl} label="Фото товара" />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="text-[11px] text-muted font-mono uppercase tracking-[0.4px]">Характеристики</div>
          <button onClick={addSpec} className="text-[12px] font-semibold cursor-pointer" style={{ color: '#ff6a13' }}>+ добавить</button>
        </div>
        {specs.map((s, i) => (
          <div key={i} className="flex gap-2">
            <div className="flex-1 bg-white border border-divider rounded-xl p-3 flex gap-2">
              <input className="flex-1 text-sm text-ink font-medium bg-transparent outline-none placeholder:text-muted" placeholder="Параметр" value={s.key} onChange={e => updateSpec(i, 'key', e.target.value)} />
              <div className="w-px bg-divider" />
              <input className="flex-1 text-sm text-ink font-medium bg-transparent outline-none placeholder:text-muted" placeholder="Значение" value={s.value} onChange={e => updateSpec(i, 'value', e.target.value)} />
            </div>
            <button onClick={() => removeSpec(i)} className="w-10 bg-white border border-divider rounded-xl grid place-items-center cursor-pointer shrink-0 text-muted">×</button>
          </div>
        ))}
      </div>

      {error && <div className="px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}

      <button
        onClick={handleSubmit}
        disabled={saving}
        className="w-full py-4 rounded-xl text-[15px] font-bold text-white cursor-pointer disabled:opacity-60"
        style={{ background: '#ff6a13' }}
      >
        {saving ? 'Сохраняем…' : 'Сохранить изменения'}
      </button>

      <div style={{ height: 32 }} />
    </div>
  );
}
