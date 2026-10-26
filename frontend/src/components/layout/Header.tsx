'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { ModeSwitch } from '@/components/ui/ModeSwitch';
import { useTelegram } from '@/hooks/useTelegram';

/** Bosh sahifa sarlavhasi: logo + Dona/Optom tanlovi */
export function BrandHeader() {
  return (
    <header className="flex items-center justify-between px-4 pt-4">
      <Link href="/" className="flex items-center gap-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo.png" alt="MIRA Cosmetics" className="size-11 rounded-full shadow-glow" />
        <span className="leading-none">
          <span className="block font-serif text-[22px] font-bold tracking-wide text-mira-700">MIRA</span>
          <span className="block text-[10px] font-bold uppercase tracking-[0.32em] text-mira-magenta">Cosmetics</span>
        </span>
      </Link>
      <ModeSwitch />
    </header>
  );
}

/** Ichki sahifalar sarlavhasi. Telegram ichida tizim "Orqaga" tugmasi bor — o'zimiznikini yashiramiz */
export function PageHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  const router = useRouter();
  const { isTelegram } = useTelegram();
  return (
    <header className="sticky top-0 z-30 glass">
      <div className="mx-auto flex h-14 max-w-md items-center gap-2 px-3">
        {!isTelegram && (
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? router.back() : router.push('/'))}
            className="flex size-10 items-center justify-center rounded-full bg-white shadow-card active:scale-95"
            aria-label="Orqaga"
          >
            <ArrowLeft className="size-5 text-mira-700" />
          </button>
        )}
        <h1 className="flex-1 truncate px-1 font-serif text-xl font-bold text-mira-700">{title}</h1>
        {right}
      </div>
    </header>
  );
}
