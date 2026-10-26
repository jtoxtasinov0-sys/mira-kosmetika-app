import type { Metadata } from 'next';
import OrderView from './OrderView';

export const metadata: Metadata = { title: 'Buyurtma', robots: { index: false } };

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ publicId: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const { publicId } = await params;
  const sp = await searchParams;
  return <OrderView publicId={publicId} isNew={sp.new === '1'} />;
}
