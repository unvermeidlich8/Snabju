'use client';

import { useSearchParams } from 'next/navigation';
import { SNABJU_DATA } from '@/lib/data';
import { useMode } from '@/providers/ModeProvider';
import { BrandMark } from '@/components/ui/BrandMark';
import { ModeChip } from '@/components/ui/ModeChip';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { fmt } from '@/lib/format';
import type { Order } from '@/lib/types';

export default function AccountPage() {
  const searchParams = useSearchParams();
  const orderPlaced = searchParams.get('orderPlaced') === '1';
  const { mode } = useMode();
  const D = SNABJU_DATA;

  const orders: Order[] = orderPlaced
    ? [{ id: 'SN-24812', date: 'сейчас', status: 'Принят', statusKind: 'progress', items: 3, total: 14580, eta: 'завтра 14:00–18:00' }, ...D.orders]
    : D.orders;

  const stats = mode === 'b2b'
    ? [['47', 'Заказов'], ['8', 'В этом мес.'], ['300 K', 'Лимит']]
    : [['12', 'Заказов'], ['1 240', 'Бонусов'], ['8', 'Любимых']];

  const menuItems: [string, string | null][] = [
    ['Адреса доставки',  '3 сохранённых'],
    ['Способы оплаты',   mode === 'b2b' ? 'Безнал · договор' : 'Карта · 4221'],
    ...(mode === 'b2b' ? [['Документы', 'Счета · акты · УПД'] as [string, string]] : []),
    ['Поддержка',        'WhatsApp · Telegram'],
    ['Выйти',            null],
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="px-4 pt-4 pb-1.5 flex items-center justify-between">
        <BrandMark size={18} />
        <ModeChip mode={mode} />
      </div>

      {/* Profile card */}
      <div className="px-4 pt-3.5">
        <div className="bg-ink text-white rounded-[18px] p-[18px] flex items-center gap-3.5">
          <div
            className="w-[52px] h-[52px] rounded-[14px] bg-accent grid place-items-center font-sans text-[22px] font-bold shrink-0"
          >
            {mode === 'b2b' ? 'СД' : 'АМ'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-base font-bold" style={{ letterSpacing: '-0.2px' }}>
              {mode === 'b2b' ? 'ООО «Строй-Дом-Север»' : 'Алексей Морозов'}
            </div>
            <div className="text-xs mt-0.5 font-mono" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {mode === 'b2b' ? 'ИНН 7707083893 · отсрочка 14 дн.' : '+7 916 224-08-19'}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 pt-3.5 grid grid-cols-3 gap-2">
        {stats.map(([v, k], i) => (
          <div key={i} className="bg-white border border-divider rounded-xl p-3">
            <div className="text-[18px] font-extrabold text-ink font-mono" style={{ letterSpacing: '-0.4px' }}>{v}</div>
            <div className="text-[11px] text-muted mt-0.5">{k}</div>
          </div>
        ))}
      </div>

      {/* Orders */}
      <div className="mt-6">
        <SectionHeader title="Заказы" action="всё" onAction={() => {}} />
        <div className="px-4 flex flex-col gap-2.5">
          {orders.map(o => {
            const dotColor = o.statusKind === 'progress' ? '#b48a00' : o.statusKind === 'done' ? '#2d7a4a' : '#a8a39a';
            return (
              <div key={o.id} className="bg-white border border-divider rounded-[14px] p-3.5">
                <div className="flex justify-between items-baseline mb-1.5">
                  <span className="text-[11px] text-muted font-mono tracking-[0.3px]">#{o.id}</span>
                  <span className="text-[11px] text-muted font-mono">{o.date}</span>
                </div>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dotColor }} />
                  <span className="text-sm font-bold text-ink">{o.status}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">{o.items} позиций</span>
                  <span className="text-sm font-bold text-ink font-mono">{fmt(o.total)}</span>
                </div>
                {o.eta && (
                  <div className="mt-2.5 px-2.5 py-2 bg-brand rounded-lg text-xs text-ink2 flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 14 14">
                      <circle cx="7" cy="7" r="5.5" fill="none" stroke="#b48a00" strokeWidth="1.4"/>
                      <path d="M7 4v3l2 1.5" stroke="#b48a00" strokeWidth="1.4" strokeLinecap="round"/>
                    </svg>
                    Доставка <b className="text-ink font-semibold">{o.eta}</b>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Menu */}
      <div className="px-4 pt-6 flex flex-col">
        {menuItems.map(([label, sub], i, arr) => (
          <div
            key={label}
            className="bg-white px-4 py-3.5 flex items-center justify-between cursor-pointer"
            style={{
              borderTop: '1px solid #e7e3da',
              borderLeft: '1px solid #e7e3da',
              borderRight: '1px solid #e7e3da',
              borderBottom: i === arr.length - 1 ? '1px solid #e7e3da' : 'none',
              borderTopLeftRadius:     i === 0             ? 14 : 0,
              borderTopRightRadius:    i === 0             ? 14 : 0,
              borderBottomLeftRadius:  i === arr.length - 1 ? 14 : 0,
              borderBottomRightRadius: i === arr.length - 1 ? 14 : 0,
            }}
          >
            <span className="text-sm font-medium text-ink">{label}</span>
            <span className="flex items-center gap-2">
              {sub && <span className="text-xs text-muted">{sub}</span>}
              <svg width="10" height="14" viewBox="0 0 10 14">
                <path d="M2 1l6 6-6 6" fill="none" stroke="#a8a39a" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </span>
          </div>
        ))}
      </div>

      <div className="py-5 text-center text-[11px] text-muted font-mono">
        snabju · v 0.1 · 2026
      </div>
    </div>
  );
}
