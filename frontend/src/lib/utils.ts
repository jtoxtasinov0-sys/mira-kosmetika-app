// Yordamchi funksiyalar — narx qoidalari backend/src/utils/pricing.js bilan bir xil
import type { OrderStatus, PriceMode, Product } from './types';

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

/** 12000 -> "12 000 ₩" */
export function formatKRW(n: number | null | undefined) {
  if (n == null) return 'Kelishiladi';
  return `${Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} ₩`;
}

/** Tanlangan rejim narxi; u yo'q bo'lsa — boshqa rejim narxi */
export function unitPrice(p: Product, mode: PriceMode) {
  return mode === 'wholesale' ? p.priceWholesale ?? p.priceRetail : p.priceRetail ?? p.priceWholesale;
}

/** Narx shu rejimniki emas (masalan dona narxi yo'q, optom narx ko'rsatilmoqda) */
export function isFallbackPrice(p: Product, mode: PriceMode) {
  return mode === 'wholesale' ? p.priceWholesale == null : p.priceRetail == null;
}

export function minQty(p: Product, mode: PriceMode) {
  return mode === 'wholesale' && p.wholesaleMin ? p.wholesaleMin : 1;
}

export const modeLabel = (m: PriceMode) => (m === 'wholesale' ? 'Optom' : 'Dona');

export const STATUS: Record<OrderStatus, { label: string; tone: string; dot: string }> = {
  new: { label: 'Tekshirilmoqda', tone: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  confirmed: { label: 'Tasdiqlandi', tone: 'bg-violet-50 text-violet-700', dot: 'bg-violet-600' },
  shipped: { label: "Jo'natildi", tone: 'bg-sky-50 text-sky-700', dot: 'bg-sky-500' },
  delivered: { label: 'Yetkazildi', tone: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  cancelled: { label: 'Bekor qilindi', tone: 'bg-rose-50 text-rose-700', dot: 'bg-rose-500' },
};

export function formatDate(d: string | Date) {
  return new Date(d).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const formatCard = (s: string) => s.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');

/** Rasmni brauzerda kichraytirish (chek va mahsulot rasmlari uchun) -> data:image/jpeg;base64 */
export async function compressImage(file: File, max = 1280, quality = 0.82) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  return { dataUrl: canvas.toDataURL('image/jpeg', quality), width: w, height: h };
}

/** Kvadrat (mahsulot kartochkasi uchun): oq fonga markazlab joylash */
export async function squareImage(file: File, size = 900, quality = 0.85) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, size, size);
  const pad = size * 0.04;
  const scale = Math.min((size - pad * 2) / bitmap.width, (size - pad * 2) / bitmap.height);
  const w = bitmap.width * scale;
  const h = bitmap.height * scale;
  ctx.drawImage(bitmap, (size - w) / 2, (size - h) / 2, w, h);
  bitmap.close?.();
  return { dataUrl: canvas.toDataURL('image/jpeg', quality), width: size, height: size };
}

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');
export const BOT_USERNAME = process.env.NEXT_PUBLIC_BOT_USERNAME || '';

export const MY_ORDERS_KEY = 'mira-orders';
