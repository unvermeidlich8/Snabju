'use client';

import { usePathname } from 'next/navigation';
import { AuthProvider } from './AuthProvider';
import { CartProvider } from './CartProvider';
import { TabBar } from '@/components/layout/TabBar';
import { ServiceWorker } from '@/components/pwa/ServiceWorker';

const TAB_PATHS = ['/', '/catalog', '/markdown', '/about', '/cart', '/account'];

export function AppProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showTabBar = TAB_PATHS.includes(pathname);

  return (
    <>
      <ServiceWorker />
      <AuthProvider>
        <CartProvider>
          <div className="min-h-screen bg-brand">
            <div className={showTabBar ? 'pb-[84px]' : ''}>
              {children}
            </div>
            {showTabBar && <TabBar />}
          </div>
        </CartProvider>
      </AuthProvider>
    </>
  );
}
