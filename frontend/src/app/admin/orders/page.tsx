import { Suspense } from 'react';
import OrdersList from './OrdersList';

export default function AdminOrdersPage() {
  return (
    <Suspense>
      <OrdersList />
    </Suspense>
  );
}
