'use client';

import { usePathname } from 'next/navigation';
import { CartProvider } from './CartProvider';
import { ModeProvider } from './ModeProvider';
import { TabBar } from '@/components/layout/TabBar';

const TAB_PATHS = ['/', '/catalog', '/cart', '/account'];

export function AppProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showTabBar = TAB_PATHS.includes(pathname);

  return (
    <ModeProvider>
      <CartProvider>
        <div className="min-h-screen bg-brand">
          <div className={showTabBar ? 'pb-[84px]' : ''}>
            {children}
          </div>
          {showTabBar && <TabBar />}
        </div>
      </CartProvider>
    </ModeProvider>
  );
}
