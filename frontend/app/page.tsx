'use client';

import { useRouter } from 'next/navigation';
import { SNABJU_DATA } from '@/lib/data';
import { useMode } from '@/providers/ModeProvider';
import { useCart } from '@/providers/CartProvider';
import { BrandMark } from '@/components/ui/BrandMark';
import { ModeChip } from '@/components/ui/ModeChip';
import { CatTile } from '@/components/ui/CatTile';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ProductCardSmall } from '@/components/cards/ProductCardSmall';

export default function HomePage() {
  const router = useRouter();
  const { mode } = useMode();
  const { addToCart } = useCart();
  const D = SNABJU_DATA;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Top bar */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <BrandMark size={22} />
        <ModeChip mode={mode} />
      </div>

      {/* Address row */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 text-[13px] text-ink2">
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M7 1c-3 0-5 2.2-5 5 0 3.5 5 7 5 7s5-3.5 5-7c0-2.8-2-5-5-5z" fill="none" stroke="#7a756d" strokeWidth="1.4"/>
            <circle cx="7" cy="6" r="1.6" fill="none" stroke="#7a756d" strokeWidth="1.4"/>
          </svg>
          Доставка в <b className="text-ink font-semibold">Москву</b>
          <svg width="10" height="10" viewBox="0 0 10 10" className="-ml-0.5">
            <path d="M2 4l3 3 3-3" stroke="#7a756d" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
          </svg>
          <span className="ml-auto text-xs text-muted font-mono">склад 22 км</span>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pb-4">
        <button
          onClick={() => router.push('/catalog')}
          className="w-full flex items-center gap-2.5 bg-white border border-divider rounded-[14px] px-3.5 py-3 cursor-pointer"
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <circle cx="8" cy="8" r="5.5" fill="none" stroke="#7a756d" strokeWidth="1.6"/>
            <path d="M12 12l4 4" stroke="#7a756d" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <span className="text-sm text-muted">Артикул, материал, бренд…</span>
          <span className="ml-auto font-mono text-[11px] text-muted border border-divider px-1.5 py-0.5 rounded">QR</span>
        </button>
      </div>

      {/* Promo banner */}
      <div className="px-4 pb-5">
        {mode === 'b2b' ? (
          <div
            className="relative overflow-hidden rounded-[18px] p-[18px] text-white"
            style={{ background: '#1a1a1a' }}
          >
            <div
              className="absolute -right-8 -top-8 w-36 h-36 rounded-full opacity-20"
              style={{ background: '#ff6a13' }}
            />
            <div className="relative">
              <div className="text-[11px] font-mono tracking-[1px] uppercase text-accent mb-1.5">
                Корпоративный счёт
              </div>
              <div className="text-[22px] font-bold leading-tight mb-2.5" style={{ letterSpacing: '-0.5px' }}>
                Отсрочка 14 дней<br />и закреплённый менеджер
              </div>
              <div className="flex gap-2 items-center">
                <button className="bg-white text-ink px-3.5 py-2 rounded-[10px] text-[13px] font-semibold cursor-pointer">
                  Подключить
                </button>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>≈ 8 минут</span>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="relative overflow-hidden rounded-[18px] p-[18px] text-white"
            style={{ background: '#ff6a13' }}
          >
            <div
              className="absolute inset-0"
              style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent 0 14px, rgba(255,255,255,0.08) 14px 15px)' }}
            />
            <div className="relative">
              <div className="text-[11px] font-mono tracking-[1px] uppercase mb-1.5 opacity-85">
                Акция недели
              </div>
              <div className="text-2xl font-bold leading-tight mb-2.5" style={{ letterSpacing: '-0.5px' }}>
                Минвата Rockwool<br />−15% на паллету
              </div>
              <button
                onClick={() => router.push('/catalog')}
                className="bg-white text-ink px-3.5 py-2 rounded-[10px] text-[13px] font-semibold cursor-pointer"
              >
                Смотреть →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Trust stats */}
      <div className="px-4 pb-6">
        <div className="grid grid-cols-3 gap-2 bg-white border border-divider rounded-[14px] py-3 px-1">
          {[
            ['Сегодня', 'если до 14:00'],
            ['12 лет', 'на рынке'],
            ['4.9 ★', '2 184 отзыва'],
          ].map(([a, b], i) => (
            <div
              key={i}
              className="text-center px-2"
              style={{ borderLeft: i ? '1px solid #e7e3da' : 'none' }}
            >
              <div className="text-sm font-bold text-ink" style={{ letterSpacing: '-0.2px' }}>{a}</div>
              <div className="text-[10.5px] text-muted mt-0.5">{b}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <SectionHeader title="Категории" action="всё" onAction={() => router.push('/catalog')} />
      <div className="grid grid-cols-3 gap-3 px-4 pb-6">
        {D.categories.slice(0, 6).map(c => (
          <CatTile key={c.id} cat={c} onClick={() => router.push('/catalog')} />
        ))}
      </div>

      {/* Hits */}
      <SectionHeader title="Хиты склада" action="всё" onAction={() => router.push('/catalog')} />
      <div className="flex gap-3 overflow-x-auto px-4 pb-6 scrollbar-hide" style={{ scrollSnapType: 'x mandatory' }}>
        {D.products.slice(0, 4).map(p => (
          <div key={p.id} className="shrink-0 w-[200px]" style={{ scrollSnapAlign: 'start' }}>
            <ProductCardSmall
              p={p}
              mode={mode}
              onClick={() => router.push(`/product/${p.id}`)}
              onAddToCart={() => addToCart(p.id, 1)}
            />
          </div>
        ))}
      </div>

      {/* Calculator teaser */}
      <div className="px-4 pb-6">
        <div className="bg-white border border-divider rounded-[16px] p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-[10px] bg-accent-soft grid place-items-center shrink-0">
            <svg width="22" height="22" viewBox="0 0 22 22">
              <rect x="4" y="3" width="14" height="16" rx="2" fill="none" stroke="#e85d0a" strokeWidth="1.6"/>
              <path d="M7 7h8M7 11h3M13 11h2M7 15h3M13 15h2" stroke="#e85d0a" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="flex-1">
            <div className="text-[15px] font-bold text-ink" style={{ letterSpacing: '-0.2px' }}>
              Калькулятор утеплителя
            </div>
            <div className="text-xs text-muted mt-0.5">
              Площадь, толщина → нужное число упаковок
            </div>
          </div>
          <svg width="12" height="20" viewBox="0 0 12 20">
            <path d="M2 2l8 8-8 8" fill="none" stroke="#a8a39a" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
      </div>
    </div>
  );
}
