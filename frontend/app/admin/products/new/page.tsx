'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { Category, ProductTag, ProductUnit } from '@/lib/types';
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

function genSku(): string {
  return 'SKU-' + Date.now().toString(36).toUpperCase().slice(-6);
}

export default function AdminNewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<string[]>([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brand, setBrand] = useState('');
  const [unit, setUnit] = useState<ProductUnit>('уп');
  const [price, setPrice] = useState('');
  const [priceBox, setPriceBox] = useState('');
  const [boxQty, setBoxQty] = useState('');
  const [stock, setStock] = useState('');
  const [stockUnit, setStockUnit] = useState('');
  const [tag, setTag] = useState<ProductTag>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([{ key: '', value: '' }]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
    api.adminGetBrands().then(setBrands).catch(() => {});
  }, []);

  const addSpec = () => setSpecs(prev => [...prev, { key: '', value: '' }]);
  const removeSpec = (i: number) => setSpecs(prev => prev.filter((_, idx) => idx !== i));
  const updateSpec = (i: number, field: 'key' | 'value', val: string) =>
    setSpecs(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));

  const handleSubmit = async () => {
    setError('');
    if (!title.trim()) { setError('Введите название'); return; }
    if (!price || Number(price) <= 0) { setError('Введите цену'); return; }
    if (priceBox && !boxQty) { setError('Укажите кол-во в коробке при установленной цене коробки'); return; }

    setSaving(true);
    try {
      const product = await api.adminCreateProduct({
        sku: genSku(),
        title: title.trim(),
        sub: description.trim(),
        category_id: categoryId || undefined,
        brand: brand.trim(),
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
      router.push(`/product/${product.id}`);
    } catch (e: any) {
      setError(e.message ?? 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-extrabold text-ink m-0" style={{ letterSpacing: '-0.5px' }}>Новый товар</h1>

      {/* Basic info */}
      <div className="flex flex-col gap-3">
        <div className="text-[11px] text-muted font-mono uppercase tracking-[0.4px]">Основное</div>

        <Field label="Название">
          <input className={inputCls} placeholder="Rockwool Лайт Баттс 50 мм" value={title} onChange={e => setTitle(e.target.value)} />
        </Field>

        <Field label="Описание" optional>
          <textarea
            className={inputCls + ' resize-none'}
            placeholder="Плиты из каменной ваты · плотность 37 кг/м³ · класс горючести НГ"
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </Field>

        <Field label="Категория">
          <select className={inputCls} value={categoryId} onChange={e => setCategoryId(e.target.value)}>
            <option value="">— выбрать —</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </Field>

        <Field label="Бренд" optional>
          <input
            className={inputCls}
            list="brands-list"
            placeholder="Rockwool"
            value={brand}
            onChange={e => setBrand(e.target.value)}
          />
          <datalist id="brands-list">
            {brands.map(b => <option key={b} value={b} />)}
          </datalist>
        </Field>
      </div>

      {/* Unit */}
      <div className="flex flex-col gap-3">
        <div className="text-[11px] text-muted font-mono uppercase tracking-[0.4px]">Единица продажи</div>
        <div className="flex gap-2">
          {UNITS.map(u => (
            <button
              key={u}
              onClick={() => setUnit(u)}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold border cursor-pointer"
              style={{
                background: unit === u ? '#1a1a1a' : '#fff',
                color: unit === u ? '#fff' : '#3c3833',
                borderColor: unit === u ? '#1a1a1a' : '#e7e3da',
              }}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="flex flex-col gap-3">
        <div className="text-[11px] text-muted font-mono uppercase tracking-[0.4px]">Цены</div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Цена, ₽">
            <input className={inputCls} type="number" min={0} placeholder="780" value={price} onChange={e => setPrice(e.target.value)} />
          </Field>
          <Field label="Цена коробки, ₽" optional>
            <input className={inputCls} type="number" min={0} placeholder="720" value={priceBox} onChange={e => setPriceBox(e.target.value)} />
          </Field>
          <Field label="Кол-во в коробке" optional>
            <input className={inputCls} type="number" min={0} placeholder="18" value={boxQty} onChange={e => setBoxQty(e.target.value)} />
          </Field>
        </div>
      </div>

      {/* Stock */}
      <div className="flex flex-col gap-3">
        <div className="text-[11px] text-muted font-mono uppercase tracking-[0.4px]">Остаток</div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Количество" optional>
            <input className={inputCls} type="number" min={0} placeholder="240" value={stock} onChange={e => setStock(e.target.value)} />
          </Field>
          <Field label="Единица остатка" optional>
            <input className={inputCls} placeholder="упаковок" value={stockUnit} onChange={e => setStockUnit(e.target.value)} />
          </Field>
        </div>
      </div>

      {/* Tag */}
      <div className="flex flex-col gap-3">
        <div className="text-[11px] text-muted font-mono uppercase tracking-[0.4px]">Метка</div>
        <div className="flex gap-2">
          {TAGS.map(t => (
            <button
              key={String(t.value)}
              onClick={() => setTag(t.value)}
              className="px-4 py-2 rounded-full text-[13px] font-medium border cursor-pointer"
              style={{
                background: tag === t.value ? '#1a1a1a' : '#fff',
                color: tag === t.value ? '#fff' : '#3c3833',
                borderColor: tag === t.value ? '#1a1a1a' : '#e7e3da',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Image */}
      <ImageUpload value={imageUrl} onChange={setImageUrl} label="Фото товара · необязательно" />

      {/* Specs */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="text-[11px] text-muted font-mono uppercase tracking-[0.4px]">Характеристики</div>
          <button onClick={addSpec} className="text-[12px] font-semibold cursor-pointer" style={{ color: '#ff6a13' }}>+ добавить</button>
        </div>
        {specs.map((s, i) => (
          <div key={i} className="flex gap-2">
            <div className="flex-1 bg-white border border-divider rounded-xl p-3 flex gap-2">
              <input
                className="flex-1 text-sm text-ink font-medium bg-transparent outline-none placeholder:text-muted"
                placeholder="Толщина"
                value={s.key}
                onChange={e => updateSpec(i, 'key', e.target.value)}
              />
              <div className="w-px bg-divider" />
              <input
                className="flex-1 text-sm text-ink font-medium bg-transparent outline-none placeholder:text-muted"
                placeholder="50 мм"
                value={s.value}
                onChange={e => updateSpec(i, 'value', e.target.value)}
              />
            </div>
            {specs.length > 1 && (
              <button
                onClick={() => removeSpec(i)}
                className="w-10 bg-white border border-divider rounded-xl grid place-items-center cursor-pointer shrink-0 text-muted"
              >
                ×
              </button>
            )}
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
        {saving ? 'Сохраняем…' : 'Создать товар'}
      </button>

      <div style={{ height: 32 }} />
    </div>
  );
}
