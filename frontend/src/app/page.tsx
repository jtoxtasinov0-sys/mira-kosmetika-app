'use client';
// Bosh sahifa
import Link from 'next/link';
import { ChevronRight, RefreshCw } from 'lucide-react';
import { BrandHeader } from '@/components/layout/Header';
import { SearchLink } from '@/components/features/SearchBar';
import { CategoryGrid, CategoryStories, CategoryStoriesSkeleton } from '@/components/features/Categories';
import { Announcement, HeroCarousel, InfoCards } from '@/components/features/HomeBlocks';
import ProductCard, { ProductCardSkeleton } from '@/components/features/ProductCard';
import { EmptyState, SectionTitle, Skeleton } from '@/components/ui';
import { useCatalog } from '@/hooks/useCatalog';
import { useTelegram } from '@/hooks/useTelegram';

const MoreLink = ({ href }: { href: string }) => (
  <Link href={href} className="flex items-center gap-0.5 pb-0.5 text-[13px] font-extrabold text-mira-magenta">
    Barchasi <ChevronRight className="size-4" />
  </Link>
);

export default function HomePage() {
  const { user } = useTelegram();
  const { categories, products, settings, isLoading, error, mutate } = useCatalog();

  const hits = products.filter((p) => p.isHit);
  const fresh = products.filter((p) => p.isNew);
  const name = user?.first_name;

  return (
    <div className="space-y-6">
      <BrandHeader />

      <section className="px-4">
        <h1 className="font-serif text-[28px] font-bold leading-tight text-mira-700">
          Salom{name ? ', ' : ''}
          {name && <span className="text-mira-gradient">{name}</span>} <span className="inline-block origin-[70%_70%] animate-[float_3s_ease-in-out_infinite]">👋</span>
        </h1>
        <p className="mt-0.5 text-[14px] text-muted">Bugun o‘zingizni nima bilan erkalaysiz?</p>
      </section>

      <SearchLink />

      {error && !products.length ? (
        <EmptyState
          title="Ulanishda xatolik"
          text="Internet aloqasini tekshirib, qayta urinib ko‘ring."
          action={
            <button className="btn-primary" onClick={() => mutate()}>
              <RefreshCw className="size-4" /> Qayta yuklash
            </button>
          }
        />
      ) : (
        <>
          {isLoading ? <CategoryStoriesSkeleton /> : <CategoryStories categories={categories} />}

          {isLoading ? (
            <div className="px-4">
              <Skeleton className="h-[206px] rounded-[28px]" />
            </div>
          ) : (
            <HeroCarousel hits={hits.slice(0, 2)} fresh={fresh.slice(0, 3)} />
          )}

          <InfoCards deliveryNote={settings?.delivery_note} />
          <Announcement text={settings?.announcement} />

          <section>
            <SectionTitle title="Kategoriyalar" action={<MoreLink href="/catalog" />} />
            {isLoading ? (
              <div className="grid grid-cols-3 gap-3 px-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[4/5] rounded-3xl" />
                ))}
              </div>
            ) : (
              <CategoryGrid categories={categories} />
            )}
          </section>

          <section>
            <SectionTitle title="Mashhur mahsulotlar" action={<MoreLink href="/catalog?sort=popular" />} />
            <div className="grid grid-cols-2 gap-3 px-4">
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
                : hits.slice(0, 6).map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          </section>

          {fresh.length > 0 && (
            <section>
              <SectionTitle title="Yangi kelganlar ✨" action={<MoreLink href="/catalog?filter=new" />} />
              <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-2">
                {fresh.map((p) => (
                  <ProductCard key={p.id} p={p} className="w-[168px] shrink-0" />
                ))}
              </div>
            </section>
          )}

          {!isLoading && products.length > 0 && (
            <section>
              <SectionTitle title="Barcha mahsulotlar" action={<MoreLink href="/catalog" />} />
              <div className="grid grid-cols-2 gap-3 px-4">
                {products
                  .filter((p) => !p.isHit)
                  .slice(0, 12)
                  .map((p) => (
                    <ProductCard key={p.id} p={p} />
                  ))}
              </div>
              <div className="px-4 pt-4">
                <Link href="/catalog" className="btn-ghost w-full">
                  Barcha {products.length} ta mahsulotni ko‘rish <ChevronRight className="size-4" />
                </Link>
              </div>
            </section>
          )}
        </>
      )}

      <footer className="px-4 pb-2 pt-2 text-center text-[11px] text-muted">
        © MIRA Cosmetics · Koreyadan original mahsulotlar
      </footer>
    </div>
  );
}
