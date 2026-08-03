'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const nav = [
  { href: '/admin/orders',       label: 'Заказы' },
  { href: '/admin/products',     label: 'Товары' },
  { href: '/admin/products/new', label: 'Добавить' },
  { href: '/admin/categories',   label: 'Категории' },
  { href: '/admin/markdown',     label: 'Уценка' },
  { href: '/admin/settings',     label: 'Оптовые условия' },
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
      <div className="bg-ink text-white px-4 py-3 flex items-center gap-6">
        <span className="text-sm font-bold font-mono tracking-tight">snabju / admin</span>
        <div className="flex gap-4">
          {nav.map(n => (
            <Link
              key={n.href}
              href={n.href}
              className="text-[13px] no-underline"
              style={{ color: pathname === n.href || (n.href !== '/admin/products' && pathname.startsWith(n.href)) ? '#ff6a13' : 'rgba(255,255,255,0.7)' }}
            >
              {n.label}
            </Link>
          ))}
        </div>
        <div className="ml-auto text-[12px] font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {user.phone}
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-6">
        {children}
      </div>
    </div>
  );
}
