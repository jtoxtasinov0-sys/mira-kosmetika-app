'use client';
import Link from 'next/link';
import useSWR from 'swr';
import { ArrowRight, BellRing, CalendarDays, Package, Users, Wallet } from 'lucide-react';
import { adminFetcher } from '@/lib/api';
import { Skeleton } from '@/components/ui';
import { StatusPill } from '@/components/features/OrderStatus';
import { cn, formatDate, formatKRW } from '@/lib/utils';
import type { Order } from '@/lib/types';

type Stats = {
  total_orders: number;
  new_orders: number;
  revenue: number;
  today_sales: number;
  today_orders: number;
  users: number;
  products: number;
  activeProducts: number;
  daily: { day: string; sum: number; orders: number }[];
  top: { product_id: number; name: string; qty: number; sum: number }[];
};

export default function AdminDashboard() {
  const { data: s } = useSWR<Stats>('/api/admin/stats', adminFetcher, { refreshInterval: 30_000 });
  const { data: recent } = useSWR<{ orders: Order[] }>('/api/admin/orders?limit=6', adminFetcher, { refreshInterval: 30_000 });

  const cards = s
    ? [
        { label: 'Yangi buyurtmalar', value: s.new_orders, Icon: BellRing, tone: 'from-[#ff4fb8] to-[#b0148c]', href: '/admin/orders?status=new' },
        { label: 'Bugungi savdo', value: formatKRW(s.today_sales), sub: `${s.today_orders} ta buyurtma`, Icon: CalendarDays, tone: 'from-[#7a2bb8] to-[#4a0e8f]' },
        { label: 'Tasdiqlangan savdo', value: formatKRW(s.revenue), sub: `Jami ${s.total_orders} ta buyurtma`, Icon: Wallet, tone: 'from-[#4a0e8f] to-[#2a0759]' },
        { label: 'Mijozlar', value: s.users, sub: `${s.activeProducts}/${s.products} mahsulot faol`, Icon: Users, tone: 'from-[#b0148c] to-[#7a2bb8]' },
      ]
    : [];
  const max = Math.max(1, ...(s?.daily.map((d) => d.sum) ?? [1]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-mira-700">Bosh panel</h1>
        <p className="text-sm text-muted">Do‘kon holati bir qarashda</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {!s
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-3xl" />)
          : cards.map(({ label, value, sub, Icon, tone, href }) => {
              const body = (
                <div className={cn('relative h-full overflow-hidden rounded-3xl bg-gradient-to-br p-4 text-white shadow-glow', tone)}>
                  <div className="absolute -right-6 -top-6 size-24 rounded-full bg-white/10" />
                  <Icon className="size-6 opacity-90" />
                  <p className="mt-3 text-[12px] font-bold uppercase tracking-wider text-white/75">{label}</p>
                  <p className="truncate text-2xl font-extrabold">{value}</p>
                  {sub && <p className="text-[12px] text-white/75">{sub}</p>}
                </div>
              );
              return href ? (
                <Link key={label} href={href}>
                  {body}
                </Link>
              ) : (
                <div key={label}>{body}</div>
              );
            })}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="card p-5 lg:col-span-3">
          <h2 className="font-serif text-xl font-bold text-mira-700">Oxirgi 7 kun</h2>
          <div className="mt-5 flex h-44 items-end gap-2">
            {(s?.daily ?? Array.from({ length: 7 }, (_, i) => ({ day: String(i), sum: 0, orders: 0 }))).map((d) => (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="text-[10px] font-bold text-muted">{d.orders || ''}</span>
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-xl bg-gradient-to-t from-mira-500 to-mira-pink transition-all duration-700"
                    style={{ height: `${Math.max(4, (d.sum / max) * 100)}%`, opacity: d.sum ? 1 : 0.25 }}
                    title={formatKRW(d.sum)}
                  />
                </div>
                <span className="text-[10.5px] font-semibold text-muted">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5 lg:col-span-2">
          <h2 className="font-serif text-xl font-bold text-mira-700">Eng ko‘p sotilgan</h2>
          {s?.top.length ? (
            <ol className="mt-3 space-y-2.5">
              {s.top.map((t, i) => (
                <li key={`${t.product_id}-${i}`} className="flex items-center gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-mira-soft text-xs font-extrabold text-mira-500">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold">{t.name}</span>
                  <span className="text-[12px] font-bold text-muted">{t.qty} dona</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-6 flex items-center gap-2 text-sm text-muted">
              <Package className="size-4" /> Hali sotuvlar yo‘q
            </p>
          )}
        </div>
      </div>

      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold text-mira-700">So‘nggi buyurtmalar</h2>
          <Link href="/admin/orders" className="flex items-center gap-1 text-sm font-extrabold text-mira-magenta">
            Barchasi <ArrowRight className="size-4" />
          </Link>
        </div>
        {!recent ? (
          <Skeleton className="h-24 rounded-2xl" />
        ) : recent.orders.length ? (
          <div className="divide-y divide-line">
            {recent.orders.map((o) => (
              <Link key={o.id} href={`/admin/orders/${o.id}`} className="flex items-center gap-3 py-3">
                <span className="font-extrabold text-mira-700">#{o.id}</span>
                <span className="min-w-0 flex-1 truncate text-sm">
                  {o.customerName} <span className="text-muted">· {formatDate(o.createdAt)}</span>
                </span>
                <span className="hidden text-sm font-extrabold sm:block">{formatKRW(o.total)}</span>
                <StatusPill status={o.status} />
              </Link>
            ))}
          </div>
        ) : (
          <p className="py-4 text-sm text-muted">Buyurtmalar hali yo‘q.</p>
        )}
      </div>
    </div>
  );
}
