'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useMode } from '@/providers/ModeProvider';
import { useCart } from '@/providers/CartProvider';
import { useAuth } from '@/providers/AuthProvider';
import { fmt, formatPhone, toApiPhone } from '@/lib/format';

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

function RadioOption({ on, title, sub, right, onClick }: { on: boolean; title: string; sub: string; right?: string; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-[14px] p-3.5 cursor-pointer flex items-center gap-3"
      style={{ border: `1px solid ${on ? '#1a1a1a' : '#e7e3da'}`, boxShadow: on ? '0 0 0 3px rgba(255,106,19,0.12)' : 'none' }}
    >
      <div className="w-5 h-5 rounded-full shrink-0 grid place-items-center" style={{ border: `2px solid ${on ? '#1a1a1a' : '#e7e3da'}` }}>
        {on && <div className="w-2 h-2 rounded-full bg-ink" />}
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold text-ink">{title}</div>
        <div className="text-xs text-muted mt-0.5" dangerouslySetInnerHTML={{ __html: sub }} />
      </div>
      {right && (
        <div className="text-[13px] font-bold font-mono" style={{ color: right === 'бесплатно' ? '#2d7a4a' : '#1a1a1a' }}>{right}</div>
      )}
    </div>
  );
}

const inputCls = 'w-full text-sm text-ink font-medium bg-transparent outline-none placeholder:text-muted';

export default function CheckoutPage() {
  const router = useRouter();
  const { mode } = useMode();
  const { items } = useCart();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const delivery: DeliveryType = 'pickup';
  const [pay, setPay] = useState<PayType>(mode === 'b2b' ? 'invoice' : 'card');
  const [address, setAddress] = useState('');
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(formatPhone(user?.phone ?? ''));
  const [guestEmail, setGuestEmail] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const orderTotal = items.reduce((s, it) => s + (it.asPallet ? (it.product.priceBox ?? it.product.price) : it.product.price) * it.qty, 0);

  const payOptions: { id: PayType; title: string; sub: string }[] = [
    ...(mode === 'b2b' ? [{ id: 'invoice' as PayType, title: 'Счёт на организацию', sub: 'оплата 14 дней, безнал' }] : []),
    { id: 'card',  title: 'Картой онлайн',          sub: 'Visa · Мир · MasterCard' },
    { id: 'split', title: 'Долями · 4 платежа',      sub: 'без процентов и переплат' },
    { id: 'cash',  title: 'Наличные при получении',  sub: 'до 100 000 ₽' },
  ];

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) {
      setError('Заполните имя и телефон');
      return;
    }
    if (!user && !guestEmail.trim()) {
      setError('Укажите email для получения уведомления о заказе');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await api.createOrder({
        contact_name: name.trim(),
        contact_phone: toApiPhone(phone),
        address: address.trim() || 'Самовывоз — Котельники, МКАД 22 км',
        ...(!user && guestEmail.trim() ? { guest_email: guestEmail.trim() } : {}),
      });
      router.push('/account?orderPlaced=1');
    } catch (e: any) {
      setError(e.message ?? 'Ошибка при оформлении заказа');
    } finally {
      setSubmitting(false);
    }
  };

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
          <div className="text-[11px] text-muted font-mono tracking-[0.4px] uppercase">Оформление</div>
          <div className="text-[18px] font-bold text-ink" style={{ letterSpacing: '-0.3px' }}>Новый заказ</div>
        </div>
      </div>

      {/* Step indicator */}
      <div className="px-4 pt-3.5">
        <div className="flex items-center gap-1.5">
          {[1, 2, 3].map(i => (
            <div key={i} className="contents">
              <div
                className="w-[26px] h-[26px] rounded-full grid place-items-center text-xs font-bold font-mono"
                style={{ background: i <= step ? '#1a1a1a' : '#fff', border: `1px solid ${i <= step ? '#1a1a1a' : '#e7e3da'}`, color: i <= step ? '#fff' : '#7a756d' }}
              >
                {i}
              </div>
              {i < 3 && <div className="flex-1 h-0.5" style={{ background: i < step ? '#1a1a1a' : '#e7e3da' }} />}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[11px] text-muted">
          {['Получение', 'Контакты', 'Оплата'].map((label, i) => (
            <span key={label} style={{ color: step >= i + 1 ? '#1a1a1a' : undefined, fontWeight: step === i + 1 ? 700 : 500 }}>
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Step 1: Pickup info */}
      {step === 1 && (
        <div className="px-4 pt-5 flex flex-col gap-2.5">
          <div className="bg-white border border-divider rounded-[14px] p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand grid place-items-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2a6 6 0 016 6c0 4-6 10-6 10S4 12 4 8a6 6 0 016-6z" stroke="#b48a00" strokeWidth="1.5"/>
                <circle cx="10" cy="8" r="2" stroke="#b48a00" strokeWidth="1.5"/>
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold text-ink">Самовывоз</div>
              <div className="text-xs text-muted mt-0.5">Котельники, МКАД 22 км · готово через 2 часа</div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Contacts */}
      {step === 2 && (
        <div className="px-4 pt-5 flex flex-col gap-2.5">
          {mode === 'b2b' && user?.company && (
            <Field label="Организация">
              <div className="text-sm text-ink font-medium">{user.company}</div>
            </Field>
          )}
          <Field label="Имя получателя">
            <input
              className={inputCls}
              placeholder="Иван Иванов"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </Field>
          <Field label="Телефон">
            <input
              className={inputCls}
              placeholder="8 (900) 000-00-00"
              type="tel"
              value={phone}
              onChange={e => setPhone(formatPhone(e.target.value))}
            />
          </Field>
          {!user && (
            <Field label="Email для уведомления">
              <input
                className={inputCls}
                placeholder="email@example.com"
                type="email"
                value={guestEmail}
                onChange={e => setGuestEmail(e.target.value)}
              />
            </Field>
          )}
          <Field label="Комментарий" optional>
            <input
              className={inputCls}
              placeholder="Позвонить за час до доставки"
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
          </Field>
        </div>
      )}

      {/* Step 3: Payment */}
      {step === 3 && (
        <div className="px-4 pt-5 flex flex-col gap-2.5">
          {payOptions.map(opt => (
            <RadioOption key={opt.id} on={pay === opt.id} title={opt.title} sub={opt.sub} onClick={() => setPay(opt.id)} />
          ))}
        </div>
      )}

      {error && (
        <div className="mx-4 mt-3 px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
      )}

      {/* Sticky footer */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 px-4 py-3 flex items-center gap-2.5 border-t border-divider"
        style={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(20px) saturate(180%)', paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        <div className="flex-1">
          <div className="text-[11px] text-muted">К оплате</div>
          <div className="text-[18px] font-extrabold text-ink font-mono" style={{ letterSpacing: '-0.3px' }}>{fmt(orderTotal)}</div>
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
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-3.5 rounded-xl text-[15px] font-bold text-white cursor-pointer bg-ink disabled:opacity-60"
          >
            {submitting ? 'Оформляем…' : 'Подтвердить'}
          </button>
        )}
      </div>
    </div>
  );
}
