'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { fmt } from '@/lib/format';
import type { AdminUser } from '@/lib/types';

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoading(true);
      api.adminListUsers({ q: query, limit: 100 })
        .then(({ items, total }) => { setUsers(items); setTotal(total); })
        .catch(() => { setUsers([]); setTotal(0); })
        .finally(() => setLoading(false));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="m-0 text-2xl font-extrabold text-ink" style={{ letterSpacing: '-0.5px' }}>Пользователи</h1>
          <p className="mt-1 mb-0 text-sm text-muted">Зарегистрированные клиенты и история их заказов</p>
        </div>
        <span className="shrink-0 font-mono text-sm text-muted">{total} всего</span>
      </div>

      <input
        value={query}
        onChange={event => setQuery(event.target.value)}
        placeholder="Поиск: организация, имя, телефон, email"
        className="w-full rounded-xl border border-divider bg-white px-4 py-3 text-sm text-ink outline-none focus:border-ink"
      />

      {loading && <div className="py-12 text-center text-sm text-muted">Загружаем пользователей…</div>}
      {!loading && users.length === 0 && <div className="py-12 text-center text-sm text-muted">Пользователи не найдены</div>}

      {!loading && users.length > 0 && (
        <div className="flex flex-col gap-3">
          {users.map(user => (
            <article key={user.id} className="rounded-[14px] border border-divider bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="m-0 truncate text-base font-bold text-ink">{user.company || user.name || 'Без названия'}</h2>
                  {user.company && user.name && <p className="mt-1 mb-0 text-sm text-ink2">{user.name}</p>}
                  <p className="mt-1 mb-0 truncate font-mono text-xs text-muted">{user.phone || user.email || 'Контакты не указаны'}</p>
                  {user.phone && user.email && <p className="mt-1 mb-0 truncate font-mono text-xs text-muted">{user.email}</p>}
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-base font-bold text-ink">{fmt(user.ordersTotal)}</div>
                  <div className="mt-0.5 text-xs text-muted">оборот</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-divider pt-3 text-xs">
                <Metric label="Заказов" value={String(user.ordersCount)} />
                <Metric label="Последний заказ" value={formatDate(user.lastOrderAt)} />
                <Metric label="Регистрация" value={formatDate(user.createdAt)} />
              </div>
              {user.lastOrderStatus && <div className="mt-3 text-xs text-muted">Статус последнего заказа: <span className="font-medium text-ink">{user.lastOrderStatus}</span></div>}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><div className="text-muted">{label}</div><div className="mt-1 truncate font-medium text-ink">{value}</div></div>;
}
