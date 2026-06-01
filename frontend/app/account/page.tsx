'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useMode } from '@/providers/ModeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { BrandMark } from '@/components/ui/BrandMark';
import { ModeChip } from '@/components/ui/ModeChip';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { fmt, formatPhone, toApiPhone } from '@/lib/format';
import type { Order } from '@/lib/types';

const inputCls =
  'w-full text-sm text-ink font-medium bg-transparent outline-none placeholder:text-muted';

// --- Auth forms ---

function AuthForms({ onSuccess }: { onSuccess: () => void }) {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!phone || !password) { setError('Заполните все поля'); return; }
    if (tab === 'register' && !email) { setError('Укажите email'); return; }
    setLoading(true);
    const apiPhone = toApiPhone(phone);
    try {
      if (tab === 'login') await login(apiPhone, password);
      else await register(apiPhone, email, password);
      onSuccess();
    } catch (e: any) {
      setError(e.message ?? 'Ошибка авторизации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 pt-4">
      {/* Tab toggle */}
      <div className="bg-white border border-divider rounded-[14px] p-1 flex mb-4">
        {(['login', 'register'] as const).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setError(''); }}
            className="flex-1 py-2 rounded-[10px] text-[13px] font-semibold cursor-pointer"
            style={{ background: tab === t ? '#1a1a1a' : 'transparent', color: tab === t ? '#fff' : '#3c3833' }}
          >
            {t === 'login' ? 'Войти' : 'Регистрация'}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="bg-white border border-divider rounded-[14px] p-3.5">
          <div className="text-[11px] text-muted font-mono tracking-[0.4px] uppercase mb-1.5">Телефон</div>
          <input className={inputCls} placeholder="8 (900) 000-00-00" type="tel" value={phone} onChange={e => setPhone(formatPhone(e.target.value))} />
        </div>

        {tab === 'register' && (
          <div className="bg-white border border-divider rounded-[14px] p-3.5">
            <div className="text-[11px] text-muted font-mono tracking-[0.4px] uppercase mb-1.5">Email</div>
            <input className={inputCls} placeholder="email@example.com" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
        )}

        <div className="bg-white border border-divider rounded-[14px] p-3.5">
          <div className="text-[11px] text-muted font-mono tracking-[0.4px] uppercase mb-1.5">Пароль</div>
          <input className={inputCls} placeholder={tab === 'register' ? 'Минимум 8 символов' : '••••••••'} type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        </div>

        {error && (
          <div className="px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3.5 rounded-[14px] text-[15px] font-bold text-white cursor-pointer disabled:opacity-60"
          style={{ background: '#ff6a13' }}
        >
          {loading ? '…' : tab === 'login' ? 'Войти' : 'Зарегистрироваться'}
        </button>
      </div>
    </div>
  );
}

// --- Profile view ---

function ProfileView() {
  const searchParams = useSearchParams();
  const orderPlaced = searchParams.get('orderPlaced') === '1';
  const { user, logout } = useAuth();
  const { mode } = useMode();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    api.getOrders().catch(() => []).then(list => {
      if (orderPlaced) {
        const fake: Order = {
          id: 'новый',
          status: 'Принят',
          statusKind: 'pending',
          itemsCount: 1,
          total: 0,
          eta: 'завтра 14:00–18:00',
          contactName: user?.name ?? '',
          contactPhone: user?.phone ?? '',
          address: '',
          createdAt: new Date().toISOString(),
        };
        setOrders([fake, ...list]);
      } else {
        setOrders(list);
      }
    });
  }, [orderPlaced, user]);

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : (user?.phone ?? '?').slice(-2);

  const stats = mode === 'b2b'
    ? [[String(orders.length), 'Заказов'], ['8', 'В этом мес.'], ['300 K', 'Лимит']]
    : [[String(orders.length), 'Заказов'], ['0', 'Бонусов'], ['0', 'Любимых']];

  const menuItems: [string, string | null][] = [
    ['Адреса доставки',  ''],
    ['Способы оплаты',   mode === 'b2b' ? 'Безнал · договор' : ''],
    ...(mode === 'b2b' ? [['Документы', 'Счета · акты · УПД'] as [string, string]] : []),
    ['Поддержка',        'WhatsApp · Telegram'],
    ['Выйти',            null],
  ];

  return (
    <>
      {/* Profile card */}
      <div className="px-4 pt-3.5">
        <div className="bg-ink text-white rounded-[18px] p-[18px] flex items-center gap-3.5">
          <div className="w-[52px] h-[52px] rounded-[14px] bg-accent grid place-items-center font-sans text-[22px] font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-base font-bold" style={{ letterSpacing: '-0.2px' }}>
              {user?.company ?? user?.name ?? user?.phone ?? '—'}
            </div>
            <div className="text-xs mt-0.5 font-mono" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {user?.phone}
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
      {orders.length > 0 && (
        <div className="mt-6">
          <SectionHeader title="Заказы" />
          <div className="px-4 flex flex-col gap-2.5">
            {orders.map(o => {
              const dotColor = o.statusKind === 'progress' ? '#b48a00' : o.statusKind === 'done' ? '#2d7a4a' : '#a8a39a';
              const date = o.createdAt ? new Date(o.createdAt).toLocaleDateString('ru', { day: 'numeric', month: 'long' }) : '';
              return (
                <div key={o.id} className="bg-white border border-divider rounded-[14px] p-3.5">
                  <div className="flex justify-between items-baseline mb-1.5">
                    <span className="text-[11px] text-muted font-mono tracking-[0.3px]">#{o.id.slice(0, 8)}</span>
                    <span className="text-[11px] text-muted font-mono">{date}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dotColor }} />
                    <span className="text-sm font-bold text-ink">{o.status}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted">{o.itemsCount} позиций</span>
                    {o.total > 0 && <span className="text-sm font-bold text-ink font-mono">{fmt(o.total)}</span>}
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
      )}

      {/* Menu */}
      <div className="px-4 pt-6 flex flex-col">
        {menuItems.map(([label, sub], i, arr) => (
          <div
            key={label}
            onClick={label === 'Выйти' ? () => logout() : undefined}
            className="bg-white px-4 py-3.5 flex items-center justify-between cursor-pointer"
            style={{
              borderTop: '1px solid #e7e3da',
              borderLeft: '1px solid #e7e3da',
              borderRight: '1px solid #e7e3da',
              borderBottom: i === arr.length - 1 ? '1px solid #e7e3da' : 'none',
              borderTopLeftRadius:     i === 0              ? 14 : 0,
              borderTopRightRadius:    i === 0              ? 14 : 0,
              borderBottomLeftRadius:  i === arr.length - 1 ? 14 : 0,
              borderBottomRightRadius: i === arr.length - 1 ? 14 : 0,
              color: label === 'Выйти' ? '#e85d0a' : undefined,
            }}
          >
            <span className="text-sm font-medium">{label}</span>
            <span className="flex items-center gap-2">
              {sub && <span className="text-xs text-muted">{sub}</span>}
              <svg width="10" height="14" viewBox="0 0 10 14">
                <path d="M2 1l6 6-6 6" fill="none" stroke="#a8a39a" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </span>
          </div>
        ))}
      </div>

      <div className="py-5 text-center text-[11px] text-muted font-mono">snabju · v 0.2 · 2026</div>
    </>
  );
}

// --- Page ---

export default function AccountPage() {
  const { user, loading } = useAuth();
  const { mode } = useMode();

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="px-4 pt-4 pb-1.5 flex items-center justify-between">
        <BrandMark size={18} />
        <ModeChip mode={mode} />
      </div>

      {loading ? (
        <div className="px-4 pt-8 text-center text-sm text-muted">Загрузка…</div>
      ) : user ? (
        <ProfileView />
      ) : (
        <>
          <div className="px-4 pt-6 pb-2">
            <h1 className="m-0 text-[26px] font-extrabold text-ink" style={{ letterSpacing: '-0.6px' }}>Аккаунт</h1>
            <p className="mt-1 text-sm text-muted">Войдите чтобы видеть заказы и управлять профилем</p>
          </div>
          <AuthForms onSuccess={() => {}} />
        </>
      )}
    </div>
  );
}
