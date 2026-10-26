'use client';
import { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowDownUp } from 'lucide-react';
import ProductCard, { ProductCardSkeleton } from '@/components/features/ProductCard';
import { ModeSwitch } from '@/components/ui/ModeSwitch';
import { EmptyState } from '@/components/ui';
import { useCatalog } from '@/hooks/useCatalog';
import { useCart } from '@/hooks/useCart';
import { haptic } from '@/hooks/useTelegram';
import { cn, unitPrice } from '@/lib/utils';

const SORTS = [
  { value: 'popular', label: 'Tavsiya etilgan' },
  { value: 'cheap', label: 'Avval arzonlari' },
  { value: 'expensive', label: 'Avval qimmatlari' },
  { value: 'name', label: 'Nomi bo‘yicha (A–Z)' },
];

export default function CatalogView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { categories, products, isLoading } = useCatalog();
  const { mode } = useCart();

  const cat = params.get('cat') || '';
  const sort = params.get('sort') || 'popular';
  const filter = params.get('filter') || '';

  const setParam = (key: string, value: string) => {
    haptic('select');
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`${pathname}${next.toString() ? `?${next}` : ''}`, { scroll: false });
  };

  const category = categories.find((c) => c.slug === cat);

  const list = useMemo(() => {
    let l = products.filter((p) => !category || p.categoryId === category.id);
    if (filter === 'new') l = l.filter((p) => p.isNew);
    if (filter === 'hit') l = l.filter((p) => p.isHit);
    const price = (x: (typeof l)[number]) => unitPrice(x, mode) ?? Number.MAX_SAFE_INTEGER;
    const sorted = [...l];
    if (sort === 'cheap') sorted.sort((a, b) => price(a) - price(b));
    else if (sort === 'expensive') sorted.sort((a, b) => (unitPrice(b, mode) ?? 0) - (unitPrice(a, mode) ?? 0));
    else if (sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
    else sorted.sort((a, b) => Number(b.isHit) - Number(a.isHit) || Number(b.inStock) - Number(a.inStock) || a.sort - b.sort);
    return sorted;
  }, [products, category, filter, sort, mode]);

  const chip = (active: boolean) =>
    cn(
      'shrink-0 rounded-full px-4 py-2 text-[13px] font-extrabold transition active:scale-95',
      active ? 'bg-mira-gradient text-white shadow-glow' : 'bg-white text-mira-700 shadow-card'
    );

  return (
    <div>
      <header className="flex items-center justify-between px-4 pb-2 pt-4">
        <div>
          <h1 className="font-serif text-[28px] font-bold leading-none text-mira-700">Katalog</h1>
          <p className="mt-1 text-[13px] text-muted">
            {category ? `${category.emoji ?? ''} ${category.name}` : 'Barcha mahsulotlar'} · {list.length} ta
          </p>
        </div>
        <ModeSwitch />
      </header>

      <div className="sticky top-0 z-20 -mt-1 bg-gradient-to-b from-mira-50 via-mira-50/95 to-mira-50/0 pb-3 pt-2">
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-1">
          <button className={chip(!cat)} onClick={() => setParam('cat', '')}>
            Barchasi
          </button>
          {categories.map((c) => (
            <button key={c.id} className={chip(cat === c.slug)} onClick={() => setParam('cat', c.slug)}>
              {c.emoji} {c.name}
            </button>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2 px-4">
          <label className="relative flex flex-1 items-center">
            <ArrowDownUp className="pointer-events-none absolute left-3 size-4 text-mira-500" />
            <select
              value={sort}
              onChange={(e) => setParam('sort', e.target.value === 'popular' ? '' : e.target.value)}
              className="h-10 w-full appearance-none rounded-full bg-white pl-9 pr-3 text-[13px] font-bold text-mira-700 shadow-card outline-none"
              style={{ fontSize: 13 }}
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          {[
            { v: 'hit', l: '🔥 Xit' },
            { v: 'new', l: '✨ Yangi' },
          ].map((f) => (
            <button
              key={f.v}
              className={cn(
                'h-10 shrink-0 rounded-full px-3.5 text-[13px] font-extrabold transition active:scale-95',
                filter === f.v ? 'bg-mira-700 text-white' : 'bg-white text-mira-700 shadow-card'
              )}
              onClick={() => setParam('filter', filter === f.v ? '' : f.v)}
            >
              {f.l}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 px-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : list.map((p) => <ProductCard key={p.id} p={p} />)}
      </div>
      {!isLoading && !list.length && (
        <EmptyState
          title="Hech narsa topilmadi"
          text="Boshqa kategoriya yoki filtrni tanlab ko‘ring."
          action={
            <button className="btn-ghost" onClick={() => router.replace('/catalog')}>
              Filtrlarni tozalash
            </button>
          }
        />
      )}
    </div>
  );
}
