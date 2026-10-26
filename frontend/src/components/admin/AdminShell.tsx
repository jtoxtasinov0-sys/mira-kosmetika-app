'use client';
// Admin panel karkasi: kirish (parol yoki Telegram), menyu, chiqish
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import {
  LayoutDashboard,
  ReceiptText,
  Package,
  FolderTree,
  Settings,
  LogOut,
  Store,
  Loader2,
  Lock,
} from 'lucide-react';
import { adminFetcher, adminToken, api } from '@/lib/api';
import { useTelegram } from '@/hooks/useTelegram';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/admin', label: 'Bosh panel', Icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Buyurtmalar', Icon: ReceiptText },
  { href: '/admin/products', label: 'Mahsulotlar', Icon: Package },
  { href: '/admin/categories', label: 'Kategoriyalar', Icon: FolderTree },
  { href: '/admin/settings', label: 'Sozlamalar', Icon: Settings },
];

function Login({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const { token } = await api<{ token: string }>('/api/admin/login', { method: 'POST', body: { password } });
      adminToken.set(token);
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Xatolik');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex min-h-dvh items-center justify-center p-5">
      <form onSubmit={submit} className="card w-full max-w-sm p-7 animate-fade-up">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo.png" alt="" className="mx-auto size-20 rounded-full shadow-glow" />
        <h1 className="mt-4 text-center font-serif text-2xl font-bold text-mira-700">MIRA Admin</h1>
        <p className="mt-1 text-center text-sm text-muted">Do‘kon boshqaruv paneli</p>
        <label className="mt-6 flex items-center gap-2 rounded-2xl border-[1.5px] border-line bg-white px-4 focus-within:border-mira-magenta">
          <Lock className="size-4 text-muted" />
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Parol"
            className="h-12 flex-1 bg-transparent outline-none"
          />
        </label>
        {err && <p className="mt-2 text-sm font-semibold text-rose-600">{err}</p>}
        <button disabled={busy || !password} className="btn-primary mt-4 w-full">
          {busy && <Loader2 className="size-4 animate-spin" />} Kirish
        </button>
        <Link href="/" className="mt-4 block text-center text-sm font-bold text-mira-magenta">
          ← Do‘konga qaytish
        </Link>
      </form>
    </div>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isTelegram } = useTelegram();
  const [state, setState] = useState<'checking' | 'login' | 'ok'>('checking');

  useEffect(() => {
    if (adminToken.get()) return setState('ok');
    if (!isTelegram) return setState('login');
    api<{ token: string }>('/api/admin/tg-login', { method: 'POST' })
      .then(({ token }) => {
        adminToken.set(token);
        setState('ok');
      })
      .catch(() => setState('login'));
  }, [isTelegram]);

  // Yangi buyurtmalar soni (menyuda belgi)
  const { data: stats, error } = useSWR<{ new_orders: number }>(state === 'ok' ? '/api/admin/stats' : null, adminFetcher, {
    refreshInterval: 30_000,
  });
  useEffect(() => {
    if ((error as { status?: number } | undefined)?.status === 401) setState('login');
  }, [error]);

  if (state === 'checking') {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="size-8 animate-spin text-mira-magenta" />
      </div>
    );
  }
  if (state === 'login') return <Login onDone={() => setState('ok')} />;

  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));

  return (
    <div className="min-h-dvh lg:flex">
      {/* Yon panel (kompyuter) */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col bg-mira-gradient p-5 text-white lg:flex">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="" className="size-11 rounded-full ring-2 ring-white/30" />
          <div>
            <p className="font-serif text-lg font-bold leading-none">MIRA</p>
            <p className="text-[11px] uppercase tracking-[0.25em] text-mira-200">Admin</p>
          </div>
        </div>
        <nav className="mt-8 flex-1 space-y-1">
          {NAV.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-2xl px-3.5 py-3 text-[14px] font-bold transition',
                isActive(href) ? 'bg-white text-mira-700 shadow-lg' : 'text-white/80 hover:bg-white/10'
              )}
            >
              <Icon className="size-5" />
              <span className="flex-1">{label}</span>
              {href === '/admin/orders' && !!stats?.new_orders && (
                <span className="rounded-full bg-mira-pink px-2 py-0.5 text-[11px] font-extrabold text-white">{stats.new_orders}</span>
              )}
            </Link>
          ))}
        </nav>
        <Link href="/" className="flex items-center gap-3 rounded-2xl px-3.5 py-3 text-[14px] font-bold text-white/80 hover:bg-white/10">
          <Store className="size-5" /> Do‘konni ochish
        </Link>
        <button
          onClick={() => {
            adminToken.clear();
            setState('login');
          }}
          className="flex items-center gap-3 rounded-2xl px-3.5 py-3 text-[14px] font-bold text-white/80 hover:bg-white/10"
        >
          <LogOut className="size-5" /> Chiqish
        </button>
      </aside>

      {/* Mobil sarlavha + tablar */}
      <div className="sticky top-0 z-30 glass lg:hidden">
        <div className="flex items-center justify-between px-4 pt-3">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.png" alt="" className="size-9 rounded-full" />
            <p className="font-serif text-lg font-bold text-mira-700">MIRA Admin</p>
          </div>
          <div className="flex gap-1">
            <Link href="/" className="rounded-full p-2 text-mira-500" aria-label="Do'kon">
              <Store className="size-5" />
            </Link>
            <button
              onClick={() => {
                adminToken.clear();
                setState('login');
              }}
              className="rounded-full p-2 text-muted"
              aria-label="Chiqish"
            >
              <LogOut className="size-5" />
            </button>
          </div>
        </div>
        <nav className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3 pt-2.5">
          {NAV.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-extrabold transition',
                isActive(href) ? 'bg-mira-gradient text-white shadow-glow' : 'bg-white text-mira-700 shadow-card'
              )}
            >
              <Icon className="size-4" />
              {label}
              {href === '/admin/orders' && !!stats?.new_orders && (
                <span className="rounded-full bg-mira-pink px-1.5 text-[10px] text-white">{stats.new_orders}</span>
              )}
            </Link>
          ))}
        </nav>
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 p-4 pb-16 lg:p-8">{children}</main>
    </div>
  );
}
