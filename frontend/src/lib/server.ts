// Server tomonida backenddan ma'lumot olish (metadata / og:image / sahifani oldindan tayyorlash uchun)
import type { Catalog, Product } from './types';

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

/**
 * Katalog Vercel keshidan olinadi va sahifa HTML'iga qo'shiladi — ilova backend (Render) uyg'onishini kutmasdan ochiladi.
 * Kesh eskirsa, eski nusxa beriladi va fonda yangilanadi.
 */
export async function getCatalogServer(): Promise<Catalog | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/catalog`, {
      next: { revalidate: 60, tags: ['catalog'] },
      signal: AbortSignal.timeout(40_000),
    });
    if (!res.ok) return null;
    return (await res.json()) as Catalog;
  } catch {
    return null;
  }
}
