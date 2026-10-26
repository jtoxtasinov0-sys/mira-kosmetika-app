'use client';
// Do'kon sahifalari uchun umumiy ramka: kenglik cheklovi va pastki menyu (asosiy bo'limlarda)
import { usePathname } from 'next/navigation';
import BottomNavigation from './BottomNavigation';
import { cn } from '@/lib/utils';

const WITH_NAV = ['/', '/catalog', '/search', '/profile'];

export default function ShopChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) return <>{children}</>;
  const nav = WITH_NAV.includes(pathname);
  return (
    <>
      <main className={cn('mx-auto min-h-dvh max-w-md', nav ? 'pb-32' : 'pb-8')}>{children}</main>
      {nav && <BottomNavigation />}
    </>
  );
}
