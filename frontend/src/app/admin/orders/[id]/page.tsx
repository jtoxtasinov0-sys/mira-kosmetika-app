'use client';
import Link from 'next/link';
import { use, useState } from 'react';
import useSWR from 'swr';
import { ArrowLeft, Loader2, MessageCircle, Phone, MapPin, ZoomIn, X } from 'lucide-react';
import { adminFetcher, api } from '@/lib/api';
import { ProductImage, Skeleton } from '@/components/ui';
import { StatusPill } from '@/components/features/OrderStatus';
import { toast } from '@/store/toastStore';
import { STATUS, cn, formatDate, formatKRW, modeLabel } from '@/lib/utils';
import type { Order, OrderStatus } from '@/lib/types';

const ACTIONS: { status: OrderStatus; label: string; cls: string }[] = [
  { status: 'confirmed', label: '✅ To‘lovni tasdiqlash', cls: 'bg-mira-gradient text-white shadow-glow' },
  { status: 'shipped', label: '🚚 Jo‘natildi', cls: 'bg-sky-500 text-white' },
  { status: 'delivered', label: '📦 Yetkazildi', cls: 'bg-emerald-500 text-white' },
  { status: 'cancelled', label: '❌ Bekor qilish', cls: 'bg-rose-50 text-rose-600' },
  { status: 'new', label: '↩️ Yangi holatga qaytarish', cls: 'bg-amber-50 text-amber-700' },
];

export default function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, mutate } = useSWR<{ order: Order }>(`/api/admin/orders/${id}`, adminFetcher);
  const [busy, setBusy] = useState<OrderStatus | null>(null);
  const [note, setNote] = useState('');
  const [zoom, setZoom] = useState(false);
  const o = data?.order;

  const setStatus = async (status: OrderStatus) => {
    setBusy(status);
    try {
      const r = await api<{ order: Order }>(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        admin: true,
        body: { status, adminNote: note.trim() || undefined },
      });
      await mutate(r, { revalidate: false });
      setNote('');
      toast(`Status: ${STATUS[status].label}. Mijozga xabar yuborildi`);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Xatolik', 'err');
    } finally {
      setBusy(null);
    }
  };

  if (!o) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48 rounded-2xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link href="/admin/orders" className="inline-flex items-center gap-1.5 text-sm font-extrabold text-mira-magenta">
        <ArrowLeft className="size-4" /> Buyurtmalar
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-bold text-mira-700">Buyurtma #{o.id}</h1>
          <p className="text-sm text-muted">{formatDate(o.createdAt)}</p>
        </div>
        <StatusPill status={o.status} />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <div className="card divide-y divide-line px-4">
            {o.items.map((i) => (
              <div key={i.id} className="flex items-center gap-3 py-3">
                <ProductImage src={i.image} alt={i.name} className="size-16 shrink-0 rounded-2xl bg-mira-50" />
                <div className="min-w-0 flex-1">
                  {i.brand && <p className="text-[10.5px] font-extrabold uppercase tracking-wider text-mira-magenta">{i.brand}</p>}
                  <p className="line-clamp-2 text-[14px] font-bold leading-snug">{i.name}</p>
                  <p className="text-[12.5px] text-muted">
                    {formatKRW(i.price)} × {i.qty}
                  </p>
                </div>
                <p className="font-extrabold text-mira-700">{formatKRW(i.subtotal)}</p>
              </div>
            ))}
            <div className="flex items-center justify-between py-4">
              <span className="text-sm font-bold text-muted">
                {o.itemsCount} dona · {modeLabel(o.priceMode)} narx
              </span>
              <span className="text-2xl font-extrabold text-mira-700">{formatKRW(o.total)}</span>
            </div>
          </div>

          <div className="card space-y-3 p-4">
            <h2 className="font-serif text-lg font-bold text-mira-700">Mijoz</h2>
            <p className="text-[15px] font-bold">{o.customerName}</p>
            <div className="flex flex-wrap gap-2">
              <a href={`tel:${o.phone.replace(/\s/g, '')}`} className="btn-ghost !py-2 text-[13px]">
                <Phone className="size-4" /> {o.phone}
              </a>
              {o.userId && (
                <a
                  href={o.username ? `https://t.me/${o.username}` : `tg://user?id=${o.userId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost !py-2 text-[13px]"
                >
                  <MessageCircle className="size-4" /> {o.username ? `@${o.username}` : 'Telegram'}
                </a>
              )}
            </div>
            {o.address && (
              <p className="flex gap-2 text-[14px]">
                <MapPin className="mt-0.5 size-4 shrink-0 text-mira-magenta" /> {o.address}
              </p>
            )}
            {o.comment && <p className="rounded-2xl bg-mira-50 p-3 text-[13.5px]">💬 {o.comment}</p>}
          </div>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="card p-4">
            <h2 className="font-serif text-lg font-bold text-mira-700">To‘lov cheki</h2>
            <p className="text-[12.5px] text-muted">Karta: {o.paymentCard || '—'} · Summa: {formatKRW(o.total)}</p>
            {o.receipt ? (
              <button type="button" onClick={() => setZoom(true)} className="relative mt-3 block w-full overflow-hidden rounded-2xl bg-mira-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={o.receipt} alt="Chek" className="max-h-96 w-full object-contain" />
                <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-mira-700">
                  <ZoomIn className="size-3.5" /> Kattalashtirish
                </span>
              </button>
            ) : (
              <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-sm text-amber-700">Chek yuklanmagan</p>
            )}
          </div>

          <div className="card space-y-2.5 p-4">
            <h2 className="font-serif text-lg font-bold text-mira-700">Statusni o‘zgartirish</h2>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Izoh (ixtiyoriy) — mijozga ko‘rinadi, masalan: trek raqam"
              className="field min-h-[70px] resize-none text-sm"
            />
            {ACTIONS.filter((a) => a.status !== o.status).map((a) => (
              <button
                key={a.status}
                disabled={!!busy}
                onClick={() => setStatus(a.status)}
                className={cn('flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-[14px] font-extrabold transition active:scale-[0.98] disabled:opacity-60', a.cls)}
              >
                {busy === a.status && <Loader2 className="size-4 animate-spin" />}
                {a.label}
              </button>
            ))}
            {o.adminNote && <p className="pt-1 text-[12.5px] text-muted">Oxirgi izoh: {o.adminNote}</p>}
          </div>
        </div>
      </div>

      {zoom && o.receipt && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4" onClick={() => setZoom(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={o.receipt} alt="Chek" className="max-h-full max-w-full rounded-2xl" />
          <button className="absolute right-4 top-4 rounded-full bg-white/90 p-2" aria-label="Yopish">
            <X className="size-5" />
          </button>
        </div>
      )}
    </div>
  );
}
