'use client';
import Link from 'next/link';
import { Search, SlidersHorizontal } from 'lucide-react';

/** Bosh sahifadagi qidiruv (bosilganda /search ochiladi) */
export function SearchLink() {
  return (
    <div className="flex items-center gap-2.5 px-4">
      <Link
        href="/search"
        className="flex h-[52px] flex-1 items-center gap-3 rounded-[20px] bg-white px-4 text-muted shadow-card active:scale-[0.99] transition"
      >
        <Search className="size-5 text-mira-500" />
        <span className="text-[15px]">Mahsulot yoki brend qidirish…</span>
      </Link>
      <Link
        href="/catalog"
        aria-label="Katalog"
        className="flex size-[52px] items-center justify-center rounded-[20px] bg-mira-gradient text-white shadow-glow active:scale-95 transition"
      >
        <SlidersHorizontal className="size-5" />
      </Link>
    </div>
  );
}
