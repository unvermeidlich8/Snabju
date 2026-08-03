'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from './AuthProvider';
import type { EnrichedCartItem } from '@/lib/types';

interface CartContextValue {
  items: EnrichedCartItem[];
  loading: boolean;
  error: string | null;
  addToCart: (productId: string, qty: number, isBox?: boolean) => Promise<void>;
  addMarkdownToCart: (markdownItemId: string, qty: number) => Promise<void>;
  updateQty: (cartItemId: string, qty: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<EnrichedCartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const refresh = useCallback(async () => {
    try {
      const cartItems = await api.getCart();
      if (cartItems.length === 0) { setItems([]); return; }
      const products = await Promise.all(
        cartItems.map(ci => api.getProduct(ci.productId).catch(() => null))
      );
      const enriched: EnrichedCartItem[] = cartItems
        .map((ci, i) => products[i] ? { ...ci, product: products[i]! } : null)
        .filter((x): x is EnrichedCartItem => x !== null);
      setItems(enriched);
    } catch {
      setItems([]);
    }
  }, []);

  // Re-fetch cart when auth state changes (login/logout)
  useEffect(() => {
    setLoading(true);
    refresh().finally(() => setLoading(false));
  }, [user, refresh]);

  const addToCart = useCallback(async (productId: string, qty: number, isBox = false) => {
    try {
      await api.addCartItem(productId, qty, isBox);
      setError(null);
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? 'Не удалось добавить товар в корзину');
      throw e;
    }
  }, [refresh]);

  const addMarkdownToCart = useCallback(async (markdownItemId: string, qty: number) => {
    try {
      await api.addMarkdownCartItem(markdownItemId, qty);
      setError(null);
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? 'Не удалось добавить товар в корзину');
      throw e;
    }
  }, [refresh]);

  const updateQty = useCallback(async (cartItemId: string, qty: number) => {
    if (qty < 1) return;
    try {
      await api.updateCartItem(cartItemId, qty);
      setError(null);
      // Optimistic local update
      setItems(prev => prev.map(it => it.id === cartItemId ? { ...it, qty } : it));
    } catch (e: any) {
      setError(e?.message ?? 'Не удалось изменить количество');
    }
  }, []);

  const removeFromCart = useCallback(async (cartItemId: string) => {
    try {
      await api.removeCartItem(cartItemId);
      setError(null);
      setItems(prev => prev.filter(it => it.id !== cartItemId));
    } catch (e: any) {
      setError(e?.message ?? 'Не удалось удалить товар из корзины');
    }
  }, []);

  return (
    <CartContext.Provider value={{ items, loading, error, addToCart, addMarkdownToCart, updateQty, removeFromCart, refresh, clearError }}>
      {error && (
        <div className="fixed top-4 left-4 right-4 z-[100] flex justify-center pointer-events-none">
          <div className="pointer-events-auto max-w-2xl w-full bg-[#fff3e0] border border-[#fed7aa] text-[#9a3412] rounded-2xl px-4 py-3 shadow-lg flex items-start gap-3">
            <div className="flex-1 text-sm font-medium leading-5">{error}</div>
            <button
              type="button"
              onClick={clearError}
              className="text-lg leading-none cursor-pointer opacity-70 hover:opacity-100"
              aria-label="Закрыть сообщение"
            >
              ×
            </button>
          </div>
        </div>
      )}
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
