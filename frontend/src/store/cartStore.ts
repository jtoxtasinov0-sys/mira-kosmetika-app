'use client';
// Zustand: savat va narx rejimi (Dona / Optom) — localStorage'da saqlanadi
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PriceMode } from '@/lib/types';

export type CartLine = { productId: number; qty: number };

type CartState = {
  mode: PriceMode;
  items: CartLine[];
  setMode: (m: PriceMode) => void;
  add: (productId: number, qty?: number) => void;
  setQty: (productId: number, qty: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      mode: 'retail',
      items: [],
      setMode: (mode) => set({ mode }),
      add: (productId, qty = 1) =>
        set((s) => {
          const found = s.items.find((i) => i.productId === productId);
          if (found) {
            return { items: s.items.map((i) => (i.productId === productId ? { ...i, qty: i.qty + qty } : i)) };
          }
          return { items: [...s.items, { productId, qty }] };
        }),
      setQty: (productId, qty) =>
        set((s) => ({
          items:
            qty <= 0
              ? s.items.filter((i) => i.productId !== productId)
              : s.items.map((i) => (i.productId === productId ? { ...i, qty: Math.min(qty, 9999) } : i)),
        })),
      remove: (productId) => set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
      clear: () => set({ items: [] }),
    }),
    { name: 'mira-cart', storage: createJSONStorage(() => localStorage), version: 1 }
  )
);
