'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import ProductCard from '@/components/features/ProductCard';
import { EmptyState } from '@/components/ui';
import { useCatalog } from '@/hooks/useCatalog';
import { haptic } from '@/hooks/useTelegram';

const RECENT_KEY = 'mira-recent-search';
const norm = (s: string) => s.toLowerCase().replace(/[ʻʼ'’`‘]/g, '').replace(/\s+/g, ' ').trim();

export default function SearchPage() {
  const { products, categoryById } = useCatalog();
  const [q, setQ] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      setRecent(JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'));
    } catch {
      /* */
    }
    inputRef.current?.focus();
  }, []);

  const remember = (term: string) => {
    const t = term.trim();
    if (t.length < 2) return;
    const next = [t, ...recent.filter((r) => r !== t)].slice(0, 8);
    setRecent(next);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  };

  const brands = useMemo(() => {
    const count = new Map<string, number>();
    for (const p of products) if (p.brand) count.set(p.brand, (count.get(p.brand) || 0) + 1);
    return [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([b]) => b);
  }, [products]);

  const results = useMemo(() => {
    const terms = norm(q).split(' ').filter(Boolean);
    if (!terms.length) return [];
    return products.filter((p) => {
      const hay = norm(
        [p.name, p.brand, p.description, p.categoryId ? categoryById.get(p.categoryId)?.name : ''].join(' ')
      );
      return terms.every((t) => hay.includes(t));
    });
  }, [q, products, categoryById]);

  return (
    <div>
      <div className="sticky top-0 z-20 bg-mira-50/90 px-4 pb-3 pt-4 backdrop-blur-xl">
        <h1 className="mb-3 font-serif text-[28px] font-bold leading-none text-mira-700">Qidiruv</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            remember(q);
            inputRef.current?.blur();
          }}
          className="flex h-[52px] items-center gap-3 rounded-[20px] bg-white px-4 shadow-card ring-2 ring-transparent focus-within:ring-mira-pink/40 transition"
        >
          <Search className="size-5 shrink-0 text-mira-500" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onBlur={() => remember(q)}
            placeholder="Krem, serum, Lagom…"
            enterKeyHint="search"
            className="h-full flex-1 bg-transparent text-ink outline-none placeholder:text-muted"
          />
          {q && (
            <button type="button" onClick={() => setQ('')} aria-label="Tozalash" className="rounded-full bg-mira-50 p-1.5">
              <X className="size-4 text-muted" />
            </button>
          )}
        </form>
      </div>

      {!q ? (
        <div className="space-y-6 px-4 pt-2">
          {recent.length > 0 && (
            <section>
              <div className="mb-2.5 flex items-center justify-between">
                <h2 className="flex items-center gap-1.5 text-sm font-extrabold text-mira-700">
                  <Clock className="size-4" /> Oxirgi qidiruvlar
                </h2>
                <button
                  className="text-xs font-bold text-muted"
                  onClick={() => {
                    setRecent([]);
                    localStorage.removeItem(RECENT_KEY);
                  }}
                >
                  Tozalash
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recent.map((r) => (
                  <button key={r} onClick={() => setQ(r)} className="rounded-full bg-white px-3.5 py-2 text-[13px] font-bold text-ink shadow-card">
                    {r}
                  </button>
                ))}
              </div>
            </section>
          )}
          <section>
            <h2 className="mb-2.5 flex items-center gap-1.5 text-sm font-extrabold text-mira-700">
              <TrendingUp className="size-4" /> Mashhur brendlar
            </h2>
            <div className="flex flex-wrap gap-2">
              {brands.map((b) => (
                <button
                  key={b}
                  onClick={() => {
                    haptic('select');
                    setQ(b);
                    remember(b);
                  }}
                  className="rounded-full bg-mira-soft px-3.5 py-2 text-[13px] font-extrabold text-mira-500"
                >
                  {b}
                </button>
              ))}
            </div>
          </section>
        </div>
      ) : results.length ? (
        <>
          <p className="px-4 pb-3 text-[13px] font-semibold text-muted">{results.length} ta natija</p>
          <div className="grid grid-cols-2 gap-3 px-4">
            {results.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </>
      ) : (
        <EmptyState title="Topilmadi" text={`“${q}” bo‘yicha mahsulot yo‘q. Boshqa so‘z bilan qidirib ko‘ring.`} />
      )}
    </div>
  );
}
