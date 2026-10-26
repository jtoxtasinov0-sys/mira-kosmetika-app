'use client';
import Link from 'next/link';
import { Plus, Minus } from 'lucide-react';
import { ProductImage } from '@/components/ui';
import { useCart } from '@/hooks/useCart';
import { haptic } from '@/hooks/useTelegram';
import { toast } from '@/store/toastStore';
import { cn, formatKRW, isFallbackPrice, minQty, unitPrice } from '@/lib/utils';
import type { Product } from '@/lib/types';

export function Badges({ p, className }: { p: Product; className?: string }) {
  if (!p.isHit && !p.isNew) return null;
  return (
    <div className={cn('flex gap-1', className)}>
      {p.isHit && (
        <span className="rounded-full bg-pink-gradient px-2.5 py-1 text-[10.5px] font-extrabold text-white shadow-md">
          🔥 Xit
        </span>
      )}
      {p.isNew && (
        <span className="rounded-full bg-mira-500 px-2.5 py-1 text-[10.5px] font-extrabold text-white shadow-md">
          ✨ Yangi
        </span>
      )}
    </div>
  );
}

export default function ProductCard({ p, className }: { p: Product; className?: string }) {
  const { mode, qtyOf, add, setQty, mounted } = useCart();
  const price = unitPrice(p, mode);
  const min = minQty(p, mode);
  const inCart = mounted ? qtyOf(p.id) : 0;
  const other = mode === 'wholesale' ? p.priceRetail : p.priceWholesale;
  const fallback = isFallbackPrice(p, mode);

  const onAdd = () => {
    if (!p.inStock || price == null) return;
    haptic('light');
    add(p.id, min);
    toast(`Savatga qo'shildi${min > 1 ? ` (${min} dona)` : ''}`);
  };

  return (
    <article className={cn('card flex flex-col p-2 animate-fade-up', className)}>
      <div className="relative">
        <Link href={`/product/${p.id}`} className="block overflow-hidden rounded-[20px] bg-white">
          <ProductImage
            src={p.image}
            alt={p.name}
            className={cn('aspect-square w-full transition duration-500 hover:scale-105', !p.inStock && 'opacity-50 grayscale')}
          />
        </Link>
        <Badges p={p} className="absolute left-2 top-2" />
        {!p.inStock && (
          <span className="absolute inset-x-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 py-1.5 text-center text-xs font-extrabold text-muted">
            Hozircha yo'q
          </span>
        )}

        {p.inStock && price != null && (
          <div className="absolute bottom-2 right-2">
            {inCart > 0 ? (
              <div className="flex items-center gap-1 rounded-full bg-white/95 p-1 shadow-card animate-pop">
                <button
                  type="button"
                  aria-label="Kamaytirish"
                  onClick={() => {
                    haptic('select');
                    setQty(p.id, inCart - 1 < min ? 0 : inCart - 1);
                  }}
                  className="flex size-8 items-center justify-center rounded-full bg-mira-50 text-mira-500"
                >
                  <Minus className="size-4" strokeWidth={2.6} />
                </button>
                <span className="min-w-5 text-center text-sm font-extrabold text-mira-700">{inCart}</span>
                <button
                  type="button"
                  aria-label="Ko'paytirish"
                  onClick={() => {
                    haptic('select');
                    setQty(p.id, inCart + 1);
                  }}
                  className="flex size-8 items-center justify-center rounded-full bg-mira-gradient text-white"
                >
                  <Plus className="size-4" strokeWidth={2.6} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onAdd}
                aria-label="Savatga qo'shish"
                className="flex size-11 items-center justify-center rounded-full bg-mira-gradient text-white shadow-glow ring-4 ring-white/70 active:scale-90 transition"
              >
                <Plus className="size-5" strokeWidth={2.8} />
              </button>
            )}
          </div>
        )}
      </div>

      <Link href={`/product/${p.id}`} className="flex flex-1 flex-col px-1.5 pb-1 pt-2.5">
        {p.brand && (
          <p className="truncate text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-mira-magenta">{p.brand}</p>
        )}
        <h3 className="mt-0.5 line-clamp-2 min-h-[2.6em] text-[13.5px] font-bold leading-[1.3] text-ink">{p.name}</h3>
        <div className="mt-auto pt-2">
          <p className="text-[16px] font-extrabold tracking-tight text-mira-700">
            {formatKRW(price)}
            {fallback && price != null && (
              <span className="ml-1 align-middle text-[10px] font-bold text-muted">
                {mode === 'wholesale' ? 'dona' : 'optom'}
              </span>
            )}
          </p>
          <p className="truncate text-[11px] font-semibold text-muted">
            {fallback
              ? mode === 'wholesale'
                ? 'Faqat dona savdo'
                : 'Faqat optom savdo'
              : mode === 'wholesale'
                ? p.wholesaleMin
                  ? `Min: ${p.wholesaleMin} dona`
                  : other != null
                    ? `Dona: ${formatKRW(other)}`
                    : 'Optom narx'
                : other != null
                  ? `Optom: ${formatKRW(other)}`
                  : 'Dona narx'}
          </p>
        </div>
      </Link>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="card p-2">
      <div className="skeleton aspect-square rounded-[20px]" />
      <div className="space-y-2 px-1.5 pb-2 pt-3">
        <div className="skeleton h-2.5 w-1/3 rounded-full" />
        <div className="skeleton h-3.5 w-full rounded-full" />
        <div className="skeleton h-3.5 w-2/3 rounded-full" />
        <div className="skeleton mt-3 h-4 w-1/2 rounded-full" />
      </div>
    </div>
  );
}
