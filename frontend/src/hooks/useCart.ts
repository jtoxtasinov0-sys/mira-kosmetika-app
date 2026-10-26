'use client';
// Savat logikasi: savatdagi id'lar + katalog ma'lumotlari = narx, jami, ogohlantirishlar
import { useEffect, useMemo, useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import { useCatalog } from './useCatalog';
import { minQty, unitPrice } from '@/lib/utils';
import type { Product } from '@/lib/types';

export type CartRow = {
  product: Product;
  qty: number;
  price: number | null;
  subtotal: number;
  min: number;
  belowMin: boolean;
};

/** localStorage'dan o'qilgan holat faqat klientda — gidratsiya farqini oldini olish */
export function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}

export function useCart() {
  const mounted = useMounted();
  const store = useCartStore();
  const { productById, isLoading } = useCatalog();
  const items = mounted ? store.items : [];
  const mode = mounted ? store.mode : 'retail';

  const rows = useMemo<CartRow[]>(() => {
    return items
      .map((i) => {
        const product = productById.get(i.productId);
        if (!product) return null;
        const price = unitPrice(product, mode);
        const min = minQty(product, mode);
        return {
          product,
          qty: i.qty,
          price,
          subtotal: (price ?? 0) * i.qty,
          min,
          belowMin: i.qty < min,
        };
      })
      .filter(Boolean) as CartRow[];
  }, [items, productById, mode]);

  const total = rows.reduce((s, r) => s + r.subtotal, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);
  const qtyOf = (id: number) => items.find((i) => i.productId === id)?.qty ?? 0;

  return {
    ...store,
    mode,
    items,
    rows,
    total,
    count,
    lines: items.length,
    qtyOf,
    mounted,
    loading: isLoading,
    hasProblems: rows.some((r) => r.belowMin || r.price == null || !r.product.inStock),
  };
}
