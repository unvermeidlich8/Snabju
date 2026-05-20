'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import type { CartItem } from '@/lib/types';
import { SNABJU_DATA } from '@/lib/data';

interface CartContextValue {
  cart: CartItem[];
  addToCart: (id: string, qty: number) => void;
  updateQty: (id: string, newQty: number) => void;
  removeFromCart: (id: string) => void;
  setCart: (cart: CartItem[]) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCartState] = useState<CartItem[]>(SNABJU_DATA.cart);

  const setCart = useCallback((newCart: CartItem[]) => {
    setCartState(newCart);
  }, []);

  const addToCart = useCallback((id: string, qty: number) => {
    setCartState(cs => {
      const existing = cs.find(c => c.id === id);
      if (existing) return cs.map(c => c.id === id ? { ...c, qty: c.qty + qty } : c);
      return [...cs, { id, qty, asPallet: false }];
    });
  }, []);

  const updateQty = useCallback((id: string, newQty: number) => {
    setCartState(cs => cs.map(c => c.id === id ? { ...c, qty: Math.max(1, newQty) } : c));
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCartState(cs => cs.filter(c => c.id !== id));
  }, []);

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQty, removeFromCart, setCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
