'use client';

import { usePathname } from 'next/navigation';
import { AuthProvider } from './AuthProvider';
import { CartProvider } from './CartProvider';
import { ModeProvider } from './ModeProvider';
import { TabBar } from '@/components/layout/TabBar';
import { ModeSelectModal } from '@/components/ui/ModeSelectModal';

const TAB_PATHS = ['/', '/catalog', '/markdown', '/cart', '/account'];

export function AppProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showTabBar = TAB_PATHS.includes(pathname);

  return (
    <ModeProvider>
      <AuthProvider>
        <CartProvider>
          <div className="min-h-screen bg-brand">
            <div className={showTabBar ? 'pb-[84px]' : ''}>
              {children}
            </div>
            {showTabBar && <TabBar />}
            <ModeSelectModal />
          </div>
        </CartProvider>
      </AuthProvider>
    </ModeProvider>
  );
}