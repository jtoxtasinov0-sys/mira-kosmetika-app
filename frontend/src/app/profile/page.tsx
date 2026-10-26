'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { ChevronRight, Crown, MessageCircle, Phone, ReceiptText, Truck } from 'lucide-react';
import { ModeSegment } from '@/components/ui/ModeSwitch';
import { StatusPill } from '@/components/features/OrderStatus';
import { EmptyState, ProductImage, Skeleton } from '@/components/ui';
import { useCatalog } from '@/hooks/useCatalog';
import { useTelegram } from '@/hooks/useTelegram';
import { adminToken, api, fetcher } from '@/lib/api';
import { MY_ORDERS_KEY, formatDate, formatKRW } from '@/lib/utils';
import type { Order } from '@/lib/types';

/** Telegram'da — serverdan, brauzerda — shu qurilmada berilgan buyurtmalar */
function useMyOrders(isTelegram: boolean, ready: boolean) {
  return useSWR<Order[]>(ready ? ['my-orders', isTelegram] : null, async () => {
    if (isTelegram) return (await fetcher<{ orders: Order[] }>('/api/me/orders')).orders;
    const ids = JSON.parse(localStorage.getItem(MY_ORDERS_KEY) || '[]') as string[];
    const res = await Promise.all(
      ids.slice(0, 15).map((id) => fetcher<{ order: Order }>(`/api/orders/${id}`).then((r) => r.order).catch(() => null))
    );
    return res.filter(Boolean) as Order[];
  });
}

export default function ProfilePage() {
  const { user, isTelegram } = useTelegram();
  const { settings } = useCatalog();
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { data: orders, isLoading } = useMyOrders(isTelegram, ready);

  useEffect(() => {
    setReady(true);
    if (adminToken.get()) setIsAdmin(true);
    else if (isTelegram) {
      api<{ token: string }>('/api/admin/tg-login', { method: 'POST' })
        .then(({ token }) => {
          adminToken.set(token);
          setIsAdmin(true);
        })
        .catch(() => {});
    }
  }, [isTelegram]);

  const name = user ? [user.first_name, user.last_name].filter(Boolean).join(' ') : 'Mehmon';
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const contact = settings?.contact_username?.replace('@', '');

  return (
    <div className="space-y-6 pt-4">
      <h1 className="px-4 font-serif text-[28px] font-bold leading-none text-mira-700">Profil</h1>

      <div className="mx-4 overflow-hidden rounded-[28px] bg-mira-gradient p-5 text-white shadow-glow">
        <div className="flex items-center gap-4">
          {user?.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.photo_url} alt="" className="size-16 rounded-full object-cover ring-4 ring-white/25" />
          ) : (
            <span className="flex size-16 items-center justify-center rounded-full bg-white/20 font-serif text-2xl font-bold ring-4 ring-white/15">
              {initials}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate font-serif text-[22px] font-bold">{name}</p>
            <p className="text-[13px] text-white/75">{user?.username ? `@${user.username}` : isTelegram ? 'Telegram mijozi' : 'Brauzer orqali'}</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/12 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-white/65">Buyurtmalar</p>
            <p className="text-xl font-extrabold">{orders?.length ?? '—'}</p>
          </div>
          <div className="rounded-2xl bg-white/12 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-white/65">Xaridlar</p>
            <p className="truncate text-xl font-extrabold">
              {orders ? formatKRW(orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0)) : '—'}
            </p>
          </div>
        </div>
      </div>

      <section className="px-4">
        <h2 className="mb-2.5 text-[13px] font-extrabold uppercase tracking-wider text-muted">Narx turi</h2>
        <ModeSegment />
      </section>

      <section className="px-4">
        <h2 className="mb-2.5 text-[13px] font-extrabold uppercase tracking-wider text-muted">Mening buyurtmalarim</h2>
        {isLoading || !ready ? (
          <div className="space-y-3">
            <Skeleton className="h-20 rounded-3xl" />
            <Skeleton className="h-20 rounded-3xl" />
          </div>
        ) : orders?.length ? (
          <ul className="space-y-3">
            {orders.map((o) => (
              <li key={o.publicId}>
                <Link href={`/orders/${o.publicId}`} className="card flex items-center gap-3 p-3 active:scale-[0.99] transition">
                  <div className="flex -space-x-3">
                    {o.items.slice(0, 3).map((i) => (
                      <ProductImage key={i.id} src={i.image} alt="" className="size-12 rounded-2xl bg-mira-50 ring-2 ring-white" />
                    ))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-extrabold text-mira-700">
                      #{o.id} <span className="whitespace-nowrap">· {formatKRW(o.total)}</span>
                    </p>
                    <p className="text-[11.5px] text-muted">{formatDate(o.createdAt)}</p>
                  </div>
                  <StatusPill status={o.status} />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="card">
            <EmptyState title="Hali buyurtma yo‘q" text="Birinchi xaridingizni qiling — biz tez yetkazamiz 🌸" />
          </div>
        )}
      </section>

      <section className="px-4">
        <h2 className="mb-2.5 text-[13px] font-extrabold uppercase tracking-wider text-muted">Do‘kon bilan aloqa</h2>
        <div className="card divide-y divide-line">
          {contact && (
            <a href={`https://t.me/${contact}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-[#e8f4ff] text-sky-600">
                <MessageCircle className="size-5" />
              </span>
              <span className="flex-1">
                <span className="block text-[14px] font-bold">Telegram orqali yozish</span>
                <span className="block text-[12px] text-muted">@{contact}</span>
              </span>
              <ChevronRight className="size-5 text-muted" />
            </a>
          )}
          {settings?.contact_phone && (
            <a href={`tel:${settings.contact_phone.replace(/\s/g, '')}`} className="flex items-center gap-3 p-4">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-mira-soft text-mira-500">
                <Phone className="size-5" />
              </span>
              <span className="flex-1">
                <span className="block text-[14px] font-bold">Qo‘ng‘iroq qilish</span>
                <span className="block text-[12px] text-muted">{settings.contact_phone}</span>
              </span>
              <ChevronRight className="size-5 text-muted" />
            </a>
          )}
          {settings?.delivery_note && (
            <div className="flex items-start gap-3 p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#fff0e8] text-[#c2410c]">
                <Truck className="size-5" />
              </span>
              <span className="text-[13px] leading-relaxed text-ink/80">{settings.delivery_note}</span>
            </div>
          )}
          <div className="flex items-start gap-3 p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#f3e9ff] text-mira-500">
              <ReceiptText className="size-5" />
            </span>
            <span className="text-[13px] leading-relaxed text-ink/80">
              To‘lov faqat karta raqamiga o‘tkazma orqali. Chekni yuklaganingizdan so‘ng admin tasdiqlaydi.
            </span>
          </div>
        </div>
      </section>

      {isAdmin && (
        <div className="px-4">
          <Link href="/admin" className="btn-primary w-full">
            <Crown className="size-5" /> Admin panel
          </Link>
        </div>
      )}
    </div>
  );
}
