'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SNABJU_DATA } from '@/lib/data';
import { useMode } from '@/providers/ModeProvider';
import { useCart } from '@/providers/CartProvider';
import { fmt } from '@/lib/format';

type DeliveryType = 'truck' | 'pickup' | 'pallet';
type PayType = 'invoice' | 'card' | 'split' | 'cash';

function Field({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-divider rounded-[14px] p-3.5">
      <div className="text-[11px] text-muted font-mono tracking-[0.4px] uppercase mb-1.5">
        {label}{optional && ' · необязательно'}
      </div>
      {children}
    </div>
  );
}

function RadioOption({ on, title, sub, right, onClick }: {
  on: boolean; title: string; sub: string; right?: string; onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-[14px] p-3.5 cursor-pointer flex items-center gap-3"
      style={{
        border: `1px solid ${on ? '#1a1a1a' : '#e7e3da'}`,
        boxShadow: on ? '0 0 0 3px rgba(255,106,19,0.12)' : 'none',
      }}
    >
      <div
        className="w-5 h-5 rounded-full shrink-0 grid place-items-center"
        style={{ border: `2px solid ${on ? '#1a1a1a' : '#e7e3da'}` }}
      >
        {on && <div className="w-2 h-2 rounded-full bg-ink" />}
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold text-ink">{title}</div>
        <div className="text-xs text-muted mt-0.5" dangerouslySetInnerHTML={{ __html: sub }} />
      </div>
      {right && (
        <div className="text-[13px] font-bold font-mono" style={{ color: right === 'бесплатно' ? '#2d7a4a' : '#1a1a1a' }}>
          {right}
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { mode } = useMode();
  const { cart } = useCart();
  const D = SNABJU_DATA;

  const [step, setStep] = useState(1);
  const [delivery, setDelivery] = useState<DeliveryType>('truck');
  const [pay, setPay] = useState<PayType>(mode === 'b2b' ? 'invoice' : 'card');

  const items = cart
    .map(c => ({ ...c, p: D.products.find(p => p.id === c.id) }))
    .filter((x): x is typeof x & { p: NonNullable<typeof x.p> } => !!x.p);

  const subtotal = items.reduce((s, it) => s + (it.asPallet ? it.p.pricePallet : it.p.price) * it.qty, 0);
  const deliveryCost = delivery === 'truck' ? 1500 : delivery === 'pallet' ? 4800 : 0;
  const orderTotal = subtotal + deliveryCost;

  const deliveryOptions: { id: DeliveryType; title: string; sub: string; cost: number; eta: string }[] = [
    { id: 'truck',  title: 'Манипулятор',        sub: 'до подъезда · разгрузка',           cost: 1500, eta: 'завтра, 14:00–18:00' },
    { id: 'pickup', title: 'Самовывоз',           sub: 'Котельники, МКАД 22 км',             cost: 0,    eta: 'через 2 часа' },
    ...(mode === 'b2b'
      ? [{ id: 'pallet' as DeliveryType, title: 'Фура · паллетами', sub: 'самовыгрузка на объекте', cost: 4800, eta: 'завтра, до 12:00' }]
      : []),
  ];

  const payOptions: { id: PayType; title: string; sub: string }[] = [
    ...(mode === 'b2b' ? [{ id: 'invoice' as PayType, title: 'Счёт на организацию', sub: 'оплата 14 дней, безнал' }] : []),
    { id: 'card',  title: 'Картой онлайн',          sub: 'Visa · Мир · MasterCard' },
    { id: 'split', title: 'Долями · 4 платежа',      sub: 'без процентов и переплат' },
    { id: 'cash',  title: 'Наличные при получении',  sub: 'до 100 000 ₽' },
  ];

  return (
    <div className="max-w-2xl mx-auto pb-28">
      {/* Header */}
      <div className="px-4 pt-4 flex items-center gap-2.5">
        <button
          onClick={() => router.push('/cart')}
          className="w-9 h-9 bg-white border border-divider rounded-[10px] grid place-items-center cursor-pointer shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M9 2L3 7l6 5" fill="none" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="flex-1">
          <div className="text-[11px] text-muted font-mono tracking-[0.4px] uppercase">Заказ #SN-24812</div>
          <div className="text-[18px] font-bold text-ink" style={{ letterSpacing: '-0.3px' }}>Оформление</div>
        </div>
      </div>

      {/* Step indicator */}
      <div className="px-4 pt-3.5">
        <div className="flex items-center gap-1.5">
          {[1, 2, 3].map(i => (
            <div key={i} className="contents">
              <div
                className="w-[26px] h-[26px] rounded-full grid place-items-center text-xs font-bold font-mono"
                style={{
                  background: i <= step ? '#1a1a1a' : '#fff',
                  border: `1px solid ${i <= step ? '#1a1a1a' : '#e7e3da'}`,
                  color: i <= step ? '#fff' : '#7a756d',
                }}
              >
                {i}
              </div>
              {i < 3 && (
                <div className="flex-1 h-0.5" style={{ background: i < step ? '#1a1a1a' : '#e7e3da' }} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[11px] text-muted">
          {['Доставка', 'Контакты', 'Оплата'].map((label, i) => (
            <span key={label} style={{ color: step >= i + 1 ? '#1a1a1a' : undefined, fontWeight: step === i + 1 ? 700 : 500 }}>
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Step 1: Delivery */}
      {step === 1 && (
        <div className="px-4 pt-5 flex flex-col gap-2.5">
          <Field label="Адрес доставки">
            <div className="text-sm text-ink font-medium">Москва, Профсоюзная 56, к2</div>
            <div className="text-xs text-muted mt-0.5">Подъезд 3, 4 этаж</div>
          </Field>
          <div className="text-[11px] text-muted font-mono tracking-[0.4px] uppercase mt-2">Способ доставки</div>
          {deliveryOptions.map(opt => (
            <RadioOption
              key={opt.id}
              on={delivery === opt.id}
              title={opt.title}
              sub={`${opt.sub} · <span style="color:#3c3833">${opt.eta}</span>`}
              right={opt.cost === 0 ? 'бесплатно' : fmt(opt.cost)}
              onClick={() => setDelivery(opt.id)}
            />
          ))}
        </div>
      )}

      {/* Step 2: Contacts */}
      {step === 2 && (
        <div className="px-4 pt-5 flex flex-col gap-2.5">
          {mode === 'b2b' && (
            <Field label="Организация">
              <div className="text-sm text-ink font-medium">ООО «Строй-Дом-Север»</div>
              <div className="text-xs text-muted mt-0.5 font-mono">ИНН 7707083893 · КПП 770701001</div>
            </Field>
          )}
          <Field label="Получатель">
            <div className="text-sm text-ink font-medium">
              {mode === 'b2b' ? 'Прораб Иван Котов' : 'Алексей Морозов'}
            </div>
          </Field>
          <Field label="Телефон">
            <div className="text-sm text-ink font-medium font-mono">+7 916 224-08-19</div>
          </Field>
          <Field label="Комментарий" optional>
            <div className="text-[13px] text-muted">Позвонить за час до доставки</div>
          </Field>
        </div>
      )}

      {/* Step 3: Payment */}
      {step === 3 && (
        <div className="px-4 pt-5 flex flex-col gap-2.5">
          {payOptions.map(opt => (
            <RadioOption
              key={opt.id}
              on={pay === opt.id}
              title={opt.title}
              sub={opt.sub}
              onClick={() => setPay(opt.id)}
            />
          ))}
        </div>
      )}

      {/* Sticky footer */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 px-4 py-3 flex items-center gap-2.5 border-t border-divider"
        style={{
          background: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(20px) saturate(180%)',
          paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        }}
      >
        <div className="flex-1">
          <div className="text-[11px] text-muted">К оплате</div>
          <div className="text-[18px] font-extrabold text-ink font-mono" style={{ letterSpacing: '-0.3px' }}>
            {fmt(orderTotal)}
          </div>
        </div>
        {step < 3 ? (
          <button
            onClick={() => setStep(step + 1)}
            className="px-6 py-3.5 rounded-xl text-[15px] font-bold text-white cursor-pointer"
            style={{ background: '#ff6a13' }}
          >
            Далее →
          </button>
        ) : (
          <button
            onClick={() => router.push('/account?orderPlaced=1')}
            className="px-6 py-3.5 rounded-xl text-[15px] font-bold text-white cursor-pointer bg-ink"
          >
            Подтвердить
          </button>
        )}
      </div>
    </div>
  );
}
