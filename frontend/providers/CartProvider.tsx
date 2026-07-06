'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from './AuthProvider';
import type { EnrichedCartItem } from '@/lib/types';

interface CartContextValue {
  items: EnrichedCartItem[];
  loading: boolean;
  addToCart: (productId: string, qty: number, asPallet?: boolean) => Promise<void>;
  addMarkdownToCart: (markdownItemId: string, qty: number) => Promise<void>;
  updateQty: (cartItemId: string, qty: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<EnrichedCartItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  const addToCart = useCallback(async (productId: string, qty: number, asPallet = false) => {
    await api.addCartItem(productId, qty, asPallet);
    await refresh();
  }, [refresh]);

  const addMarkdownToCart = useCallback(async (markdownItemId: string, qty: number) => {
    await api.addMarkdownCartItem(markdownItemId, qty);
    await refresh();
  }, [refresh]);

  const updateQty = useCallback(async (cartItemId: string, qty: number) => {
    if (qty < 1) return;
    await api.updateCartItem(cartItemId, qty);
    // Optimistic local update
    setItems(prev => prev.map(it => it.id === cartItemId ? { ...it, qty } : it));
  }, []);

  const removeFromCart = useCallback(async (cartItemId: string) => {
    await api.removeCartItem(cartItemId);
    setItems(prev => prev.filter(it => it.id !== cartItemId));
  }, []);

  return (
    <CartContext.Provider value={{ items, loading, addToCart, addMarkdownToCart, updateQty, removeFromCart, refresh }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}