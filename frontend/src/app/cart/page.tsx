'use client';
import Link from 'next/link';
import { Trash2, AlertTriangle, ArrowRight, ShoppingBag } from 'lucide-react';
import { PageHeader } from '@/components/layout/Header';
import { ModeSegment } from '@/components/ui/ModeSwitch';
import { EmptyState, ProductImage, QtyStepper, Skeleton } from '@/components/ui';
import { useCart } from '@/hooks/useCart';
import { haptic } from '@/hooks/useTelegram';
import { cn, formatKRW, modeLabel } from '@/lib/utils';

export default function CartPage() {
  const cart = useCart();
  const { rows, total, count, mode, mounted, loading } = cart;

  if (!mounted || (loading && cart.lines > 0)) {
    return (
      <div>
        <PageHeader title="Savat" />
        <div className="space-y-3 p-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div>
        <PageHeader title="Savat" />
        <EmptyState
          title="Savatingiz bo‘sh"
          text="Yoqqan mahsulotlarni “+” tugmasi bilan savatga qo‘shing."
          action={
            <Link href="/catalog" className="btn-primary">
              <ShoppingBag className="size-5" /> Xaridni boshlash
            </Link>
          }
        />
      </div>
    );
  }

  const blocked = cart.hasProblems;

  return (
    <div className="pb-44">
      <PageHeader
        title="Savat"
        right={
          <button
            onClick={() => {
              haptic('medium');
              cart.clear();
            }}
            className="rounded-full px-3 py-2 text-[13px] font-bold text-muted active:text-rose-500"
          >
            Tozalash
          </button>
        }
      />

      <div className="space-y-4 px-4 pt-2">
        <div>
          <ModeSegment />
          <p className="mt-2 px-1 text-[12px] text-muted">
            {mode === 'wholesale'
              ? 'Optom narxlar qo‘llanmoqda. Ba’zi mahsulotlarda minimal miqdor bor.'
              : 'Dona (chakana) narxlar qo‘llanmoqda. Ko‘p olsangiz — Optomni tanlang.'}
          </p>
        </div>

        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.product.id} className="card flex gap-3 p-2.5 animate-fade-up">
              <Link href={`/product/${r.product.id}`} className="shrink-0">
                <ProductImage src={r.product.image} alt={r.product.name} className="size-[92px] rounded-[18px] bg-mira-50" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    {r.product.brand && (
                      <p className="truncate text-[10px] font-extrabold uppercase tracking-[0.14em] text-mira-magenta">{r.product.brand}</p>
                    )}
                    <p className="line-clamp-2 text-[13.5px] font-bold leading-snug">{r.product.name}</p>
                  </div>
                  <button
                    onClick={() => {
                      haptic('light');
                      cart.remove(r.product.id);
                    }}
                    aria-label="O'chirish"
                    className="rounded-full p-1.5 text-muted active:text-rose-500"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                  <div>
                    <p className="text-[15px] font-extrabold text-mira-700">{formatKRW(r.subtotal)}</p>
                    <p className="text-[11px] font-semibold text-muted">
                      {formatKRW(r.price)} × {r.qty}
                    </p>
                  </div>
                  <QtyStepper value={r.qty} onChange={(v) => cart.setQty(r.product.id, v)} min={1} size="sm" allowZero />
                </div>
                {r.belowMin && (
                  <button
                    onClick={() => cart.setQty(r.product.id, r.min)}
                    className="mt-2 flex items-center gap-1.5 rounded-xl bg-amber-50 px-2.5 py-1.5 text-left text-[11.5px] font-bold text-amber-700"
                  >
                    <AlertTriangle className="size-3.5 shrink-0" />
                    Optomda kamida {r.min} dona — bosib to‘g‘rilang
                  </button>
                )}
                {(r.price == null || !r.product.inStock) && (
                  <p className="mt-2 rounded-xl bg-rose-50 px-2.5 py-1.5 text-[11.5px] font-bold text-rose-600">
                    {r.product.inStock ? 'Narx kelishiladi — savatdan olib tashlang' : 'Hozircha mavjud emas'}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 safe-bottom">
        <div className="glass mx-auto max-w-md rounded-[28px] p-3 shadow-card ring-1 ring-white/70">
          <div className="flex items-center justify-between px-1.5 pb-2.5">
            <span className="text-[13px] font-semibold text-muted">
              {count} dona · {modeLabel(mode)} narx
            </span>
            <span className="text-[20px] font-extrabold tracking-tight text-mira-700">{formatKRW(total)}</span>
          </div>
          <Link
            href={blocked ? '#' : '/checkout'}
            aria-disabled={blocked}
            onClick={(e) => {
              if (blocked) {
                e.preventDefault();
                haptic('error');
              } else haptic('medium');
            }}
            className={cn('btn-primary w-full', blocked && 'pointer-events-auto opacity-50')}
          >
            Rasmiylashtirish <ArrowRight className="size-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
