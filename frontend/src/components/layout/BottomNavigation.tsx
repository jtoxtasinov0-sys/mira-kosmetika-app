'use client';
// Suzuvchi pastki menyu + markazda savat "orb" tugmasi
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, Search, UserRound, ShoppingBag } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { haptic } from '@/hooks/useTelegram';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/', label: 'Asosiy', Icon: Home },
  { href: '/catalog', label: 'Katalog', Icon: LayoutGrid },
  null,
  { href: '/search', label: 'Qidiruv', Icon: Search },
  { href: '/profile', label: 'Profil', Icon: UserRound },
] as const;

export default function BottomNavigation() {
  const pathname = usePathname();
  const { count, mounted } = useCart();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 safe-bottom">
      <div className="relative mx-auto max-w-md">
        <div className="glass grid grid-cols-5 items-end rounded-[28px] px-1.5 py-1.5 shadow-card ring-1 ring-white/60">
          {TABS.map((t, i) => {
            if (!t) return <div key={i} />;
            const active = t.href === '/' ? pathname === '/' : pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                onClick={() => haptic('select')}
                className="flex flex-col items-center gap-0.5 py-1"
              >
                <span
                  className={cn(
                    'flex h-9 w-12 items-center justify-center rounded-2xl transition-all duration-300',
                    active ? 'bg-mira-soft text-mira-500' : 'text-muted'
                  )}
                >
                  <t.Icon className="size-[22px]" strokeWidth={active ? 2.4 : 1.9} />
                </span>
                <span className={cn('text-[11px] font-bold', active ? 'text-mira-500' : 'text-muted')}>{t.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Savat orb */}
        <Link
          href="/cart"
          aria-label="Savat"
          onClick={() => haptic('medium')}
          className="absolute -top-6 left-1/2 -translate-x-1/2"
        >
          <span className="relative flex size-[68px] items-center justify-center rounded-full bg-white p-1.5 shadow-card">
            <span className="flex size-full items-center justify-center rounded-full bg-mira-gradient text-white shadow-glow active:scale-95 transition">
              <ShoppingBag className="size-7" strokeWidth={2} />
            </span>
            {mounted && count > 0 && (
              <span
                key={count}
                className="absolute -right-0.5 -top-0.5 flex h-6 min-w-6 animate-pop items-center justify-center rounded-full bg-mira-pink px-1.5 text-xs font-extrabold text-white ring-2 ring-white"
              >
                {count > 99 ? '99+' : count}
              </span>
            )}
          </span>
        </Link>
      </div>
    </nav>
  );
}
