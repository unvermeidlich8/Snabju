'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/providers/CartProvider';

const tabs = [
  { id: 'home',     href: '/',          label: 'Главная', icon: 'home' },
  { id: 'catalog',  href: '/catalog',   label: 'Каталог', icon: 'cat' },
  { id: 'markdown', href: '/markdown',  label: 'Уценка',  icon: 'tag' },
  { id: 'about',    href: '/about',     label: 'О нас',   icon: 'info' },
  { id: 'cart',     href: '/cart',      label: 'Корзина', icon: 'cart' },
  { id: 'account',  href: '/account',   label: 'Профиль', icon: 'user' },
];

function TabIcon({ k, on }: { k: string; on: boolean }) {
  const c = on ? '#1a1a1a' : '#7a756d';
  const sw = { stroke: c, strokeWidth: 1.7, fill: 'none' as const, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (k === 'home') return <svg width="22" height="22" viewBox="0 0 22 22"><path d="M3 10l8-7 8 7v9a1 1 0 01-1 1h-4v-7H8v7H4a1 1 0 01-1-1z" {...sw}/></svg>;
  if (k === 'cat')  return <svg width="22" height="22" viewBox="0 0 22 22"><rect x="3" y="3" width="7" height="7" rx="1.2" {...sw}/><rect x="12" y="3" width="7" height="7" rx="1.2" {...sw}/><rect x="3" y="12" width="7" height="7" rx="1.2" {...sw}/><rect x="12" y="12" width="7" height="7" rx="1.2" {...sw}/></svg>;
  if (k === 'cart') return <svg width="22" height="22" viewBox="0 0 22 22"><path d="M3 4h2l2 11h11l2-8H6" {...sw}/><circle cx="9" cy="19" r="1.5" {...sw}/><circle cx="17" cy="19" r="1.5" {...sw}/></svg>;
  if (k === 'info') return <svg width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="11" r="8.5" {...sw}/><path d="M11 10v5" {...sw}/><circle cx="11" cy="7" r="1" fill={c}/></svg>;
  if (k === 'tag')  {
    const bg = on ? '#1a1a1a' : '#ff6a13';
    return (
      <svg width="24" height="24" viewBox="0 0 24 24">
        <path
          d="M12 2.8l2.1 2 2.9-.7 1.1 2.8 3 .6-.3 3 2.2 2.1-1.8 2.4.8 2.9-2.8 1.1-.7 2.9-3-.3-2.1 2.2-2.4-1.8-2.9.8-1.1-2.8-2.9-.7.3-3-2.2-2.1 1.8-2.4-.8-2.9 2.8-1.1.7-2.9 3 .3z"
          fill={bg}
        />
        <path d="M8.2 15.8L15.8 8.2" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        <circle cx="9" cy="9" r="1.4" fill="#fff" />
        <circle cx="15" cy="15" r="1.4" fill="#fff" />
      </svg>
    );
  }
  return <svg width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="8" r="4" {...sw}/><path d="M3 20c1.5-4 5-6 8-6s6.5 2 8 6" {...sw}/></svg>;
}

export function TabBar() {
  const pathname = usePathname();
  const { items } = useCart();
  const cartCount = items.reduce((s, c) => s + c.qty, 0);

  const activeId = pathname === '/' ? 'home' : tabs.find(t => t.href !== '/' && pathname.startsWith(t.href))?.id ?? 'home';

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-divider"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        paddingBottom: 'env(safe-area-inset-bottom, 16px)',
      }}
    >
      <div className="flex px-2 pt-2">
        {tabs.map(t => {
          const on = activeId === t.id;
          const isMarkdown = t.id === 'markdown';
          return (
            <Link
              key={t.id}
              href={t.href}
              className="flex-1 flex flex-col items-center gap-0.5 py-1.5 no-underline relative"
            >
              <div
                className="relative rounded-2xl px-2 py-1 transition-transform"
                style={{
                  background: isMarkdown && !on ? 'radial-gradient(ellipse at center, rgba(255,106,19,0.18) 0%, rgba(255,106,19,0.10) 55%, rgba(255,106,19,0) 100%)' : 'transparent',
                  transform: isMarkdown && !on ? 'translateY(-1px)' : undefined,
                }}
              >
                <TabIcon k={t.icon} on={on} />
                {t.id === 'cart' && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-accent text-white text-[10px] font-bold font-mono flex items-center justify-center leading-none">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
                {isMarkdown && !on && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#ffd166] border border-white" />
                )}
              </div>
              <span
                className={`text-[10px] tracking-[0.1px] ${on ? 'font-bold text-ink' : isMarkdown ? 'font-bold text-accent' : 'font-medium text-muted'}`}
              >
                {t.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
