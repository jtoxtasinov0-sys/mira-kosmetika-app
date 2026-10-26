'use client';
// Serverda olingan katalog SWR'ga boshlang'ich ma'lumot sifatida beriladi: sahifa darhol to'liq chiqadi,
// yangi ma'lumot esa fonda yuklanadi
import { SWRConfig } from 'swr';
import type { Catalog } from '@/lib/types';

export default function CatalogProvider({ catalog, children }: { catalog: Catalog | null; children: React.ReactNode }) {
  return <SWRConfig value={{ fallback: catalog ? { '/api/catalog': catalog } : {} }}>{children}</SWRConfig>;
}
