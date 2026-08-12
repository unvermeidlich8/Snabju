'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const nav = [
  { href: '/admin/orders',       label: 'Заказы' },
  { href: '/admin/products',     label: 'Товары' },
  { href: '/admin/categories',   label: 'Категории' },
  { href: '/admin/markdown',     label: 'Уценка' },
  { href: '/admin/users',        label: 'Пользователи' },
  { href: '/admin/settings',     label: 'Настройки' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) {
      router.replace('/account');
    }
  }, [user, loading, router]);

  if (loading || !user?.isAdmin) {
    return <div className="flex items-center justify-center h-screen text-sm text-muted">Загрузка…</div>;
  }

  return (
    <div className="min-h-screen" style={{ background: '#f5f2ec' }}>
      {/* Top bar */}
      <div className="bg-ink text-white">
        <div className="px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <span className="shrink-0 text-sm font-bold font-mono tracking-tight">snabju / admin</span>
          <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-1 sm:px-0 sm:pb-0" style={{ WebkitOverflowScrolling: 'touch' }}>
          {nav.map(n => (
            <Link
              key={n.href}
              href={n.href}
              className="shrink-0 whitespace-nowrap text-[13px] no-underline"
              style={{ color: pathname === n.href || (n.href !== '/admin/products' && pathname.startsWith(n.href)) ? '#ff6a13' : 'rgba(255,255,255,0.7)' }}
            >
              {n.label}
            </Link>
          ))}
          </div>
          <div className="hidden shrink-0 text-[12px] font-mono lg:block" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {user.phone}
          </div>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-6">
        {children}
      </div>
    </div>
  );
}
