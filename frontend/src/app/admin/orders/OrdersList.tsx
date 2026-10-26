'use client';
import Link from 'next/link';
import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { Search, Phone } from 'lucide-react';
import { adminFetcher } from '@/lib/api';
import { ProductImage, Skeleton } from '@/components/ui';
import { StatusPill } from '@/components/features/OrderStatus';
import { STATUS, cn, formatDate, formatKRW, modeLabel } from '@/lib/utils';
import type { Order, OrderStatus } from '@/lib/types';

const TABS: { value: '' | OrderStatus; label: string }[] = [
  { value: '', label: 'Barchasi' },
  { value: 'new', label: STATUS.new.label },
  { value: 'confirmed', label: STATUS.confirmed.label },
  { value: 'shipped', label: STATUS.shipped.label },
  { value: 'delivered', label: STATUS.delivered.label },
  { value: 'cancelled', label: STATUS.cancelled.label },
];

export default function OrdersList() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const status = params.get('status') || '';
  const [q, setQ] = useState('');
  const key = `/api/admin/orders?limit=100${status ? `&status=${status}` : ''}${q.trim() ? `&q=${encodeURIComponent(q.trim())}` : ''}`;
  const { data, isLoading } = useSWR<{ orders: Order[] }>(key, adminFetcher, { refreshInterval: 20_000, keepPreviousData: true });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-bold text-mira-700">Buyurtmalar</h1>
          <p className="text-sm text-muted">Chekni tekshiring va statusni o‘zgartiring</p>
        </div>
        <label className="flex h-11 w-full items-center gap-2 rounded-2xl bg-white px-3.5 shadow-card sm:w-72">
          <Search className="size-4 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="#raqam, ism yoki telefon"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ fontSize: 14 }}
          />
        </label>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => router.replace(t.value ? `${pathname}?status=${t.value}` : pathname)}
            className={cn(
              'shrink-0 rounded-full px-4 py-2 text-[13px] font-extrabold transition',
              status === t.value ? 'bg-mira-700 text-white' : 'bg-white text-mira-700 shadow-card'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading && !data ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-3xl" />
          ))}
        </div>
      ) : data?.orders.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {data.orders.map((o) => (
            <Link key={o.id} href={`/admin/orders/${o.id}`} className="card block p-4 transition hover:-translate-y-0.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-lg font-extrabold text-mira-700">
                    #{o.id} <span className="text-[13px] font-semibold text-muted">· {formatDate(o.createdAt)}</span>
                  </p>
                  <p className="text-[14px] font-bold">{o.customerName}</p>
                  <p className="flex items-center gap-1 text-[12.5px] text-muted">
                    <Phone className="size-3" /> {o.phone}
                    {o.username && <span className="text-mira-magenta">· @{o.username}</span>}
                  </p>
                </div>
                <StatusPill status={o.status} />
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="flex -space-x-2.5">
                  {o.items.slice(0, 5).map((i) => (
                    <ProductImage key={i.id} src={i.image} alt="" className="size-10 rounded-xl bg-mira-50 ring-2 ring-white" />
                  ))}
                  {o.items.length > 5 && (
                    <span className="flex size-10 items-center justify-center rounded-xl bg-mira-soft text-xs font-extrabold text-mira-500 ring-2 ring-white">
                      +{o.items.length - 5}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-extrabold">{formatKRW(o.total)}</p>
                  <p className="text-[11.5px] font-semibold text-muted">
                    {o.itemsCount} dona · {modeLabel(o.priceMode)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card p-10 text-center text-muted">Buyurtmalar topilmadi</div>
      )}
    </div>
  );
}
