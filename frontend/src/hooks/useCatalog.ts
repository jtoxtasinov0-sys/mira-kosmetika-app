'use client';
import useSWR from 'swr';
import { useMemo } from 'react';
import { fetcher } from '@/lib/api';
import type { Catalog } from '@/lib/types';

export function useCatalog() {
  const { data, error, isLoading, mutate } = useSWR<Catalog>('/api/catalog', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30_000,
    keepPreviousData: true,
  });

  const maps = useMemo(() => {
    const products = new Map((data?.products ?? []).map((p) => [p.id, p]));
    const categories = new Map((data?.categories ?? []).map((c) => [c.id, c]));
    return { products, categories };
  }, [data]);

  return {
    catalog: data,
    categories: data?.categories ?? [],
    products: data?.products ?? [],
    settings: data?.settings,
    productById: maps.products,
    categoryById: maps.categories,
    error,
    // Serverdan kelgan boshlang'ich katalog bo'lsa, fondagi yangilanish "yuklanmoqda" hisoblanmaydi
    isLoading: isLoading && !data,
    mutate,
  };
}
