'use client';
import Link from 'next/link';
import useSWR from 'swr';
import { MessageCircle, Home } from 'lucide-react';
import { PageHeader } from '@/components/layout/Header';
import { StatusPill, StatusTimeline } from '@/components/features/OrderStatus';
import { EmptyState, ProductImage, Sakura, Skeleton } from '@/components/ui';
import { useCatalog } from '@/hooks/useCatalog';
import { fetcher } from '@/lib/api';
import { formatDate, formatKRW, modeLabel } from '@/lib/utils';
import type { Order } from '@/lib/types';

export default function OrderView({ publicId, isNew }: { publicId: string; isNew: boolean }) {
  const { settings } = useCatalog();
  const { data, error, isLoading } = useSWR<{ order: Order }>(`/api/orders/${publicId}`, fetcher, {
    refreshInterval: 20_000,
  });
  const o = data?.order;

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Buyurtma" />
        <div className="space-y-4 p-4">
          <Skeleton className="h-40 rounded-3xl" />
          <Skeleton className="h-56 rounded-3xl" />
        </div>
      </div>
    );
  }
  if (error || !o) {
    return (
      <div>
        <PageHeader title="Buyurtma" />
        <EmptyState title="Buyurtma topilmadi" action={<Link href="/" className="btn-primary">Bosh sahifa</Link>} />
      </div>
    );
  }

  const contact = settings?.contact_username ? `https://t.me/${settings.contact_username.replace('@', '')}` : null;

  return (
    <div className="pb-10">
      <PageHeader title={`Buyurtma #${o.id}`} />
      <div className="space-y-4 px-4 pt-3">
        {isNew && (
          <div className="relative overflow-hidden rounded-[28px] bg-mira-gradient p-6 text-center text-white shadow-glow animate-fade-up">
            {[8, 22, 70, 86, 50].map((x, i) => (
              <span
                key={i}
                className="absolute animate-float"
                style={{ left: `${x}%`, top: `${(i * 37) % 80}%`, animationDelay: `${i * 0.7}s` }}
              >
                <Sakura className="text-mira-200/70" size={16 + (i % 3) * 8} />
              </span>
            ))}
            <div className="relative mx-auto flex size-20 animate-pop items-center justify-center rounded-full bg-white/15 text-4xl">💜</div>
            <h2 className="relative mt-3 font-serif text-[26px] font-bold">Rahmat! Buyurtma qabul qilindi</h2>
            <p className="relative mt-1.5 text-[13.5px] text-white/85">
              To‘lov chekingiz adminga yuborildi. Tasdiqlangach sizga xabar beramiz.
            </p>
          </div>
        )}

        <div className="card p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[12px] font-bold text-muted">{formatDate(o.createdAt)}</p>
              <p className="font-serif text-xl font-bold text-mira-700">#{o.id}</p>
            </div>
            <StatusPill status={o.status} />
          </div>
          <StatusTimeline status={o.status} />
          {o.adminNote && <p className="mt-4 rounded-2xl bg-mira-50 p-3 text-[13px] text-ink">📝 {o.adminNote}</p>}
        </div>

        <div className="card divide-y divide-line px-4">
          {o.items.map((i) => (
            <div key={i.id} className="flex items-center gap-3 py-3">
              <ProductImage src={i.image} alt={i.name} className="size-14 shrink-0 rounded-2xl bg-mira-50" />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-[13.5px] font-bold leading-snug">{i.name}</p>
                <p className="text-[12px] text-muted">
                  {formatKRW(i.price)} × {i.qty}
                </p>
              </div>
              <p className="text-[14px] font-extrabold text-mira-700">{formatKRW(i.subtotal)}</p>
            </div>
          ))}
          <div className="flex items-center justify-between py-3.5">
            <span className="text-[13px] font-bold text-muted">
              Jami · {o.itemsCount} dona · {modeLabel(o.priceMode)}
            </span>
            <span className="text-[20px] font-extrabold text-mira-700">{formatKRW(o.total)}</span>
          </div>
        </div>

        <div className="card space-y-1.5 p-4 text-[13.5px]">
          <p><span className="text-muted">Qabul qiluvchi:</span> <b>{o.customerName}</b></p>
          <p><span className="text-muted">Telefon:</span> <b>{o.phone}</b></p>
          {o.address && <p><span className="text-muted">Manzil:</span> <b>{o.address}</b></p>}
          {o.comment && <p><span className="text-muted">Izoh:</span> {o.comment}</p>}
        </div>

        <div className="flex gap-3">
          <Link href="/" className="btn-ghost flex-1">
            <Home className="size-5" /> Bosh sahifa
          </Link>
          {contact && (
            <a href={contact} target="_blank" rel="noreferrer" className="btn-primary flex-1">
              <MessageCircle className="size-5" /> Admin
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
