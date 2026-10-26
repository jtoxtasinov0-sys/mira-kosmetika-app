'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { Plus, Search, Pencil } from 'lucide-react';
import { adminFetcher, api } from '@/lib/api';
import { ProductImage, Skeleton } from '@/components/ui';
import { toast } from '@/store/toastStore';
import { cn, formatKRW } from '@/lib/utils';
import type { Category, Product } from '@/lib/types';

type Flag = 'isActive' | 'isHit' | 'isNew' | 'inStock';
const FLAGS: { key: Flag; label: string; on: string }[] = [
  { key: 'isActive', label: 'Sotuvda', on: 'bg-emerald-500 text-white' },
  { key: 'inStock', label: 'Mavjud', on: 'bg-sky-500 text-white' },
  { key: 'isHit', label: 'Xit', on: 'bg-mira-pink text-white' },
  { key: 'isNew', label: 'Yangi', on: 'bg-mira-500 text-white' },
];

export default function AdminProductsPage() {
  const { data, mutate } = useSWR<{ products: Product[] }>('/api/admin/products', adminFetcher);
  const { data: cats } = useSWR<{ categories: Category[] }>('/api/admin/categories', adminFetcher);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<number | 0>(0);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (data?.products ?? []).filter(
      (p) =>
        (!cat || p.categoryId === cat) &&
        (!t || `${p.name} ${p.brand ?? ''} #${p.id}`.toLowerCase().includes(t))
    );
  }, [data, q, cat]);

  const toggle = async (p: Product, key: Flag) => {
    const next = !p[key];
    await mutate(
      (d) => d && { products: d.products.map((x) => (x.id === p.id ? { ...x, [key]: next } : x)) },
      { revalidate: false }
    );
    try {
      await api(`/api/admin/products/${p.id}`, { method: 'PATCH', admin: true, body: { [key]: next } });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Xatolik', 'err');
      mutate();
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-bold text-mira-700">Mahsulotlar</h1>
          <p className="text-sm text-muted">{data ? `${data.products.length} ta mahsulot` : 'Yuklanmoqda…'}</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary !py-3">
          <Plus className="size-5" /> Yangi mahsulot
        </Link>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="flex h-11 flex-1 items-center gap-2 rounded-2xl bg-white px-3.5 shadow-card">
          <Search className="size-4 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nomi, brend yoki #id"
            className="flex-1 bg-transparent outline-none"
            style={{ fontSize: 14 }}
          />
        </label>
        <select
          value={cat}
          onChange={(e) => setCat(Number(e.target.value))}
          className="h-11 rounded-2xl bg-white px-3.5 font-bold text-mira-700 shadow-card outline-none"
          style={{ fontSize: 14 }}
        >
          <option value={0}>Barcha kategoriyalar</option>
          {cats?.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.emoji} {c.name}
            </option>
          ))}
        </select>
      </div>

      {!data ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-3xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {list.map((p) => (
            <div key={p.id} className={cn('card flex gap-3 p-3', !p.isActive && 'opacity-60')}>
              <Link href={`/admin/products/${p.id}`} className="shrink-0">
                <ProductImage src={p.image} alt={p.name} className="size-[84px] rounded-2xl bg-mira-50" />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[10.5px] font-extrabold uppercase tracking-wider text-mira-magenta">
                      #{p.id} · {p.brand || '—'} · {p.categoryName || 'Kategoriyasiz'}
                    </p>
                    <p className="line-clamp-2 text-[14px] font-bold leading-snug">{p.name}</p>
                  </div>
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-mira-soft text-mira-500"
                    aria-label="Tahrirlash"
                  >
                    <Pencil className="size-4" />
                  </Link>
                </div>
                <p className="mt-1 text-[12.5px] text-muted">
                  Dona: <b className="text-ink">{formatKRW(p.priceRetail)}</b> · Optom:{' '}
                  <b className="text-ink">{formatKRW(p.priceWholesale)}</b>
                  {p.wholesaleMin ? ` (${p.wholesaleMin}+)` : ''}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {FLAGS.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => toggle(p, f.key)}
                      className={cn(
                        'rounded-full px-2.5 py-1 text-[11px] font-extrabold transition',
                        p[f.key] ? f.on : 'bg-mira-50 text-muted line-through decoration-1'
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
