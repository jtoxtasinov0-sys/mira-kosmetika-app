'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { ArrowLeft, Boxes, CreditCard, Truck, ShoppingBag, Check, Info } from 'lucide-react';
import ProductCard, { Badges } from '@/components/features/ProductCard';
import ShareButton from '@/components/features/ShareButton';
import { EmptyState, ProductImage, QtyStepper, SectionTitle, Skeleton } from '@/components/ui';
import { useCatalog } from '@/hooks/useCatalog';
import { useCart } from '@/hooks/useCart';
import { haptic, useTelegram } from '@/hooks/useTelegram';
import { fetcher } from '@/lib/api';
import { toast } from '@/store/toastStore';
import { cn, formatKRW, minQty, unitPrice } from '@/lib/utils';
import type { PriceMode, Product } from '@/lib/types';

export default function ProductView({ id, initial }: { id: number; initial: Product | null }) {
  const router = useRouter();
  const { isTelegram } = useTelegram();
  const { productById, products, settings, categoryById } = useCatalog();
  const { data, isLoading } = useSWR<{ product: Product }>(
    productById.has(id) ? null : `/api/products/${id}`,
    fetcher,
    { fallbackData: initial ? { product: initial } : undefined }
  );
  const p = productById.get(id) ?? data?.product ?? null;
  const cart = useCart();
  const { mode, setMode } = cart;

  const min = p ? minQty(p, mode) : 1;
  const [qty, setQty] = useState(min);
  useEffect(() => setQty(min), [min]);

  if (!p) {
    if (isLoading) {
      return (
        <div className="space-y-4 p-4">
          <Skeleton className="aspect-square w-full rounded-[32px]" />
          <Skeleton className="h-4 w-1/3 rounded-full" />
          <Skeleton className="h-7 w-full rounded-full" />
          <Skeleton className="h-24 w-full rounded-3xl" />
        </div>
      );
    }
    return (
      <EmptyState
        title="Mahsulot topilmadi"
        text="Bu mahsulot sotuvdan olingan bo‘lishi mumkin."
        action={
          <Link href="/catalog" className="btn-primary">
            Katalogga o‘tish
          </Link>
        }
      />
    );
  }

  const price = unitPrice(p, mode);
  const inCart = cart.qtyOf(p.id);
  const category = p.categoryId ? categoryById.get(p.categoryId) : undefined;
  const similar = products.filter((x) => x.categoryId === p.categoryId && x.id !== p.id).slice(0, 8);
  const canBuy = p.inStock && price != null;

  const addToCart = () => {
    if (!canBuy) return;
    haptic('success');
    cart.add(p.id, Math.max(qty, min));
    toast(`Savatga qo'shildi · ${Math.max(qty, min)} dona`);
  };

  const PriceTile = ({ m, value, sub }: { m: PriceMode; value: number | null; sub: string }) => (
    <button
      type="button"
      disabled={value == null}
      onClick={() => {
        haptic('select');
        setMode(m);
      }}
      className={cn(
        'relative flex-1 rounded-3xl p-3.5 text-left transition',
        mode === m ? 'bg-mira-gradient text-white shadow-glow' : 'bg-white text-ink shadow-card',
        value == null && 'opacity-50'
      )}
    >
      {mode === m && (
        <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-white/25">
          <Check className="size-3.5" strokeWidth={3} />
        </span>
      )}
      <span className={cn('block text-[11px] font-extrabold uppercase tracking-wider', mode === m ? 'text-mira-200' : 'text-muted')}>
        {m === 'wholesale' ? 'Optom' : 'Dona'}
      </span>
      <span className="mt-0.5 block text-[21px] font-extrabold tracking-tight">{formatKRW(value)}</span>
      <span className={cn('mt-0.5 block text-[11.5px] font-semibold', mode === m ? 'text-white/80' : 'text-muted')}>{sub}</span>
    </button>
  );

  return (
    <div className="pb-36">
      {/* Rasm */}
      <div className="relative px-3 pt-3">
        <div className="relative overflow-hidden rounded-[32px] bg-white shadow-card">
          <ProductImage src={p.image} alt={p.name} className="aspect-square w-full" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-mira-50/70 to-transparent" />
        </div>
        <div className="absolute left-6 right-6 top-6 flex items-start justify-between">
          {!isTelegram ? (
            <button
              type="button"
              aria-label="Orqaga"
              onClick={() => (window.history.length > 1 ? router.back() : router.push('/'))}
              className="flex size-11 items-center justify-center rounded-full bg-white/90 text-mira-700 shadow-card backdrop-blur active:scale-90"
            >
              <ArrowLeft className="size-5" />
            </button>
          ) : (
            <Badges p={p} />
          )}
          <ShareButton product={p} />
        </div>
      </div>

      <div className="space-y-5 px-4 pt-5">
        <div className="animate-fade-up">
          {!isTelegram && <Badges p={p} className="mb-2" />}
          <div className="flex flex-wrap items-center gap-2">
            {p.brand && (
              <span className="text-[12px] font-extrabold uppercase tracking-[0.18em] text-mira-magenta">{p.brand}</span>
            )}
            {category && (
              <Link href={`/catalog?cat=${category.slug}`} className="rounded-full bg-mira-soft px-2.5 py-1 text-[11px] font-bold text-mira-500">
                {category.emoji} {category.name}
              </Link>
            )}
          </div>
          <h1 className="mt-1.5 font-serif text-[26px] font-bold leading-[1.18] text-mira-700">{p.name}</h1>
          {!p.inStock && (
            <p className="mt-2 inline-block rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-600">Hozircha mavjud emas</p>
          )}
        </div>

        <div className="flex gap-3">
          <PriceTile m="retail" value={p.priceRetail} sub="1 donadan" />
          <PriceTile
            m="wholesale"
            value={p.priceWholesale}
            sub={p.wholesaleMin ? `${p.wholesaleMin} donadan` : p.priceWholesale != null ? 'Ko‘p miqdorda' : 'Kelishiladi'}
          />
        </div>

        {(p.wholesaleNote || p.boxNote) && (
          <div className="card divide-y divide-line px-4">
            {p.wholesaleNote && (
              <div className="flex items-start gap-3 py-3">
                <Info className="mt-0.5 size-5 shrink-0 text-mira-500" />
                <div>
                  <p className="text-[13px] font-extrabold text-ink">Optom sharti</p>
                  <p className="text-[13px] text-muted">{p.wholesaleNote}</p>
                </div>
              </div>
            )}
            {p.boxNote && (
              <div className="flex items-start gap-3 py-3">
                <Boxes className="mt-0.5 size-5 shrink-0 text-mira-magenta" />
                <div>
                  <p className="text-[13px] font-extrabold text-ink">
                    Karobka (quti) {p.priceBox != null && <span className="text-mira-magenta">· {formatKRW(p.priceBox)}</span>}
                  </p>
                  <p className="text-[13px] text-muted">{p.boxNote}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {p.description && (
          <section>
            <h2 className="mb-1.5 font-serif text-lg font-bold text-mira-700">Tavsif</h2>
            <p className="text-[14.5px] leading-relaxed text-ink/80">{p.description}</p>
          </section>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="card p-3.5">
            <CreditCard className="size-5 text-mira-500" />
            <p className="mt-2 text-[13px] font-extrabold">Karta orqali to‘lov</p>
            <p className="text-[11.5px] leading-snug text-muted">O‘tkazma qilib, chekni yuklaysiz</p>
          </div>
          <div className="card p-3.5">
            <Truck className="size-5 text-mira-magenta" />
            <p className="mt-2 text-[13px] font-extrabold">Yetkazib berish</p>
            <p className="line-clamp-2 text-[11.5px] leading-snug text-muted">
              {settings?.delivery_note?.split('.')[0] || 'Koreya bo‘ylab'}
            </p>
          </div>
        </div>
      </div>

      {similar.length > 0 && (
        <section className="pt-7">
          <SectionTitle title="O‘xshash mahsulotlar" />
          <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-2">
            {similar.map((x) => (
              <ProductCard key={x.id} p={x} className="w-[164px] shrink-0" />
            ))}
          </div>
        </section>
      )}

      {/* Pastki harakat paneli */}
      <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 safe-bottom">
        <div className="glass mx-auto flex max-w-md items-center gap-3 rounded-[28px] p-2.5 shadow-card ring-1 ring-white/70">
          {canBuy ? (
            <>
              <QtyStepper value={qty} onChange={setQty} min={min} size="md" />
              <button type="button" onClick={addToCart} className="btn-primary flex-1 !py-3">
                <ShoppingBag className="size-5" />
                <span className="flex flex-col items-start leading-tight">
                  <span className="text-[13px]">Savatga</span>
                  <span className="text-[12px] font-semibold opacity-85">{formatKRW((price ?? 0) * Math.max(qty, min))}</span>
                </span>
              </button>
              {cart.mounted && inCart > 0 && (
                <Link
                  href="/cart"
                  className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-mira-soft text-mira-500"
                  aria-label="Savat"
                >
                  <ShoppingBag className="size-5" />
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-mira-pink px-1 text-[11px] font-extrabold text-white">
                    {inCart}
                  </span>
                </Link>
              )}
            </>
          ) : (
            <a
              href={settings?.contact_username ? `https://t.me/${settings.contact_username}` : '#'}
              className="btn-ghost flex-1"
            >
              {p.inStock ? 'Narxni admin bilan kelishish' : 'Kelganda xabar berish — adminga yozing'}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
