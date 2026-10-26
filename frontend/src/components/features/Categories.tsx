'use client';
import Link from 'next/link';
import { ProductImage } from '@/components/ui';
import { haptic } from '@/hooks/useTelegram';
import type { Category } from '@/lib/types';

/** Instagram "stories" uslubidagi kategoriyalar (gradient halqa) */
export function CategoryStories({ categories }: { categories: Category[] }) {
  return (
    <div className="no-scrollbar flex gap-3.5 overflow-x-auto px-4 pb-1 pt-1">
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`/catalog?cat=${c.slug}`}
          onClick={() => haptic('select')}
          className="flex w-[74px] shrink-0 flex-col items-center gap-1.5 active:scale-95 transition"
        >
          <span className="ring-story rounded-full p-[2.5px]">
            <span className="block rounded-full bg-mira-50 p-[2.5px]">
              <ProductImage src={c.image} alt={c.name} eager className="size-[62px] rounded-full bg-white" />
            </span>
          </span>
          <span className="w-full truncate text-center text-[11.5px] font-bold text-ink">{c.name}</span>
        </Link>
      ))}
    </div>
  );
}

export function CategoryStoriesSkeleton() {
  return (
    <div className="flex gap-3.5 overflow-hidden px-4 pt-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex w-[74px] shrink-0 flex-col items-center gap-2">
          <div className="skeleton size-[72px] rounded-full" />
          <div className="skeleton h-2.5 w-12 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/** 3 ustunli kategoriya kartochkalari, mahsulot soni bilan */
export function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <div className="grid grid-cols-3 gap-3 px-4">
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`/catalog?cat=${c.slug}`}
          onClick={() => haptic('select')}
          className="card group relative flex flex-col items-center p-2 pb-3 active:scale-[0.97] transition"
        >
          <span className="relative w-full overflow-hidden rounded-[18px] bg-mira-50">
            <ProductImage src={c.image} alt={c.name} className="aspect-square w-full transition duration-500 group-hover:scale-105" />
            <span className="absolute right-1.5 top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-mira-gradient px-1.5 text-[11px] font-extrabold text-white shadow-md">
              {c.count}
            </span>
          </span>
          <span className="mt-2 flex items-center gap-1 text-center text-[12.5px] font-bold leading-tight text-ink">
            {c.emoji && <span>{c.emoji}</span>}
            <span className="line-clamp-2">{c.name}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}
