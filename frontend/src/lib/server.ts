// Server tomonida backenddan ma'lumot olish (metadata / og:image uchun)
import type { Product } from './types';

export const BACKEND_URL = (process.env.BACKEND_URL || 'http://localhost:4000').replace(/\/$/, '');

export async function getProductServer(id: string): Promise<Product | null> {
  if (!/^\d+$/.test(id)) return null;
  try {
    const res = await fetch(`${BACKEND_URL}/api/products/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return ((await res.json()) as { product: Product }).product;
  } catch {
    return null;
  }
}
