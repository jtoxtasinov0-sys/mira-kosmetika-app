import { Suspense } from 'react';
import type { Metadata } from 'next';
import CatalogView from './CatalogView';

export const metadata: Metadata = { title: 'Katalog' };

export default function CatalogPage() {
  return (
    <Suspense>
      <CatalogView />
    </Suspense>
  );
}
