import type { Metadata } from 'next';
import { getProductServer } from '@/lib/server';
import { formatKRW } from '@/lib/utils';
import ProductView from './ProductView';

type Props = { params: Promise<{ id: string }> };

/** Havola ulashilganda (Telegram, WhatsApp, Instagram) rasm va narx bilan chiqishi uchun */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const p = await getProductServer(id);
  if (!p) return { title: 'Mahsulot topilmadi' };

  const prices = [
    p.priceRetail != null ? `Dona: ${formatKRW(p.priceRetail)}` : null,
    p.priceWholesale != null ? `Optom: ${formatKRW(p.priceWholesale)}` : null,
  ]
    .filter(Boolean)
    .join(' · ');
  const description = [p.brand, prices, p.description].filter(Boolean).join(' — ');

  return {
    title: p.name,
    description,
    openGraph: {
      type: 'website',
      title: `${p.name} | MIRA Cosmetics`,
      description,
      url: `/product/${p.id}`,
    },
    twitter: { card: 'summary_large_image', title: p.name, description },
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const initial = await getProductServer(id);
  return <ProductView id={Number(id)} initial={initial} />;
}
