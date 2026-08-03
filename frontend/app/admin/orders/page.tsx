'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { fmt } from '@/lib/format';
import type { Order, OrderItem } from '@/lib/types';

type StatusKind = Order['statusKind'];

const STATUS_META: Record<StatusKind, { label: string; bg: string; text: string; dot: string }> = {
  pending:   { label: 'Новый',     bg: '#fef3c7', text: '#92400e', dot: '#f59e0b' },
  progress:  { label: 'В работе',  bg: '#dbeafe', text: '#1e40af', dot: '#3b82f6' },
  done:      { label: 'Выполнен',  bg: '#d1fae5', text: '#065f46', dot: '#10b981' },
  cancelled: { label: 'Отменён',   bg: '#f3f4f6', text: '#6b7280', dot: '#9ca3af' },
};

const ACTIONS: Record<string, { label: string; kind: StatusKind; status: string; danger?: boolean }[]> = {
  pending:  [
    { label: 'В работе',  kind: 'progress',  status: 'В работе' },
    { label: 'Отменить',  kind: 'cancelled', status: 'Отменён', danger: true },
  ],
  progress: [
    { label: 'Выполнен',  kind: 'done',      status: 'Выполнен' },
    { label: 'Отменить',  kind: 'cancelled', status: 'Отменён', danger: true },
  ],
  done: [],
  cancelled: [],
};

function shortId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' })
    + ' ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterKind, setFilterKind] = useState<StatusKind | 'all'>('all');

  useEffect(() => {
    api.adminListOrders({ limit: 100 })
      .then(({ items, total }) => { setOrders(items); setTotal(total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (order: Order, kind: StatusKind, status: string) => {
    setUpdatingId(order.id);
    try {
      const updated = await api.adminUpdateOrderStatus(order.id, kind, status);
      setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
    } catch {
      // no-op
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = filterKind === 'all' ? orders : orders.filter(o => o.statusKind === filterKind);
  const counts = orders.reduce((acc, o) => {
    acc[o.statusKind] = (acc[o.statusKind] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-ink m-0" style={{ letterSpacing: '-0.5px' }}>
          Заказы
        </h1>
        <span className="text-sm text-muted font-mono">{total} всего</span>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'progress', 'done', 'cancelled'] as const).map(k => {
          const isAll = k === 'all';
          const meta = isAll ? null : STATUS_META[k];
          const count = isAll ? orders.length : (counts[k] ?? 0);
          const active = filterKind === k;
          return (
            <button
              key={k}
              onClick={() => setFilterKind(k)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer border transition-colors"
              style={{
                background: active ? '#1a1a1a' : '#fff',
                color: active ? '#fff' : '#3c3833',
                borderColor: active ? '#1a1a1a' : '#e7e3da',
              }}
            >
              {meta && <span className="w-1.5 h-1.5 rounded-full" style={{ background: active ? '#fff' : meta.dot }} />}
              {isAll ? 'Все' : meta!.label}
              <span className="font-mono opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="py-12 text-center text-sm text-muted">Загружаем заказы…</div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="py-12 text-center text-sm text-muted">Заказов нет</div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="flex flex-col gap-3">
          {filtered.map(order => {
            const meta = STATUS_META[order.statusKind];
            const actions = ACTIONS[order.statusKind] ?? [];
            const expanded = expandedId === order.id;
            const isUpdating = updatingId === order.id;

            return (
              <div
                key={order.id}
                className="bg-white border border-divider rounded-[14px] overflow-hidden"
              >
                {/* Header row */}
                <button
                  onClick={() => setExpandedId(expanded ? null : order.id)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 cursor-pointer text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold text-ink2">#{shortId(order.id)}</span>
                      <span className="text-[11px] text-muted">{formatDate(order.createdAt)}</span>
                    </div>
                    <div className="text-sm font-semibold text-ink truncate">{order.contactName}</div>
                    <div className="text-xs text-muted font-mono">{order.contactPhone}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold"
                      style={{ background: meta.bg, color: meta.text }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.dot }} />
                      {meta.label}
                    </div>
                    <div className="text-sm font-bold text-ink font-mono">{fmt(order.total)}</div>
                  </div>
                  <svg
                    width="12" height="12" viewBox="0 0 12 12"
                    className="shrink-0 ml-1"
                    style={{ transform: expanded ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s' }}
                  >
                    <path d="M2 4l4 4 4-4" stroke="#a8a39a" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
                  </svg>
                </button>

                {/* Expanded details */}
                {expanded && (
                  <div className="border-t border-divider px-4 py-4 flex flex-col gap-4">
                    {/* Info grid */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                      <InfoRow label="Полный ID" value={order.id} mono />
                      <InfoRow label="Позиций" value={String(order.itemsCount)} />
                      <InfoRow label="Сумма" value={fmt(order.total)} mono />
                      {order.eta && <InfoRow label="ETA" value={order.eta} />}
                      <InfoRow label="Адрес / Самовывоз" value={order.address || '—'} />
                      <InfoRow label="Получение" value={deliveryLabel(order.deliveryMethod)} />
                      <InfoRow label="Оплата" value={paymentLabel(order.paymentMethod)} />
					  <InfoRow label="Организация" value={order.company || '—'} />
                      {order.contactPhone && <InfoRow label="Телефон" value={order.contactPhone} mono />}
                    </div>

                    {order.comment && (
                      <div className="rounded-xl bg-brand px-3.5 py-3">
                        <div className="text-[10.5px] text-muted font-mono uppercase tracking-[0.3px] mb-1">Комментарий клиента</div>
                        <div className="text-sm text-ink">{order.comment}</div>
                      </div>
                    )}

                    {/* Order items */}
                    {order.items && order.items.length > 0 && (
                      <div className="rounded-xl border p-3.5" style={{ background: '#fff8f2', borderColor: '#fed7aa' }}>
                        <div className="text-[10.5px] font-mono uppercase tracking-[0.3px] mb-2" style={{ color: '#c2410c' }}>Состав заказа</div>
                        <div className="flex flex-col gap-1">
                          {order.items.map((item: OrderItem) => (
                            <div key={item.id} className="flex items-center justify-between gap-3 py-2 border-b border-divider last:border-0">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-ink truncate">{item.title}</div>
                                <div className="text-xs text-muted font-mono">{item.sku} · {fmt(item.price)}/{item.unit || 'шт'}</div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="text-sm font-bold text-ink font-mono">{fmt(item.total)}</div>
                                <div className="text-xs text-muted">{item.qty} {item.unit || 'шт'}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    {actions.length > 0 && (
                      <div className="flex gap-2 pt-1">
                        {actions.map(a => (
                          <button
                            key={a.kind}
                            onClick={() => handleStatusChange(order, a.kind, a.status)}
                            disabled={isUpdating}
                            className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-50 transition-colors"
                            style={{
                              background: a.danger ? '#fee2e2' : '#f4f1eb',
                              color: a.danger ? '#dc2626' : '#1a1a1a',
                            }}
                          >
                            {isUpdating ? '…' : a.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function deliveryLabel(method: string) {
  return method === 'pickup' ? 'Самовывоз' : 'Доставка';
}

function paymentLabel(method: string) {
  return ({ invoice: 'Счёт на организацию', card: 'Картой онлайн', split: 'Долями', cash: 'Наличными' } as Record<string, string>)[method] ?? method;
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10.5px] text-muted font-mono uppercase tracking-[0.3px] mb-0.5">{label}</div>
      <div className={`text-sm text-ink break-all ${mono ? 'font-mono' : 'font-medium'}`}>{value}</div>
    </div>
  );
}
