'use client';
// Mini App yuklanganini tekshiruvchi provayder: ranglar, Back tugmasi, start_param orqali sahifaga o'tish
import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getWebApp } from '@/hooks/useTelegram';

const ROOT_TABS = ['/', '/catalog', '/search', '/profile'];

export default function TelegramProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const handled = useRef(false);

  // Bir martalik sozlash
  useEffect(() => {
    const wa = getWebApp();
    if (!wa) return;
    wa.ready();
    wa.expand();
    try {
      wa.setHeaderColor('#FFF5FB');
      wa.setBackgroundColor('#FFF5FB');
      wa.setBottomBarColor?.('#FFF5FB');
      if (wa.isVersionAtLeast('7.7')) wa.disableVerticalSwipes?.();
    } catch {
      /* eski Telegram versiyalari */
    }

    // t.me/<bot>/<app>?startapp=p_12  →  /product/12
    if (!handled.current) {
      handled.current = true;
      const sp = wa.initDataUnsafe.start_param || '';
      const m = /^p_?(\d+)$/.exec(sp);
      if (m) router.push(`/product/${m[1]}`);
      else if (sp.startsWith('o_')) router.push(`/orders/${sp.slice(2)}`);
      else if (sp === 'cart') router.push('/cart');
    }
  }, [router]);

  // Telegram'ning tizim "Orqaga" tugmasi
  useEffect(() => {
    const wa = getWebApp();
    if (!wa) return;
    const onBack = () => (window.history.length > 1 ? router.back() : router.push('/'));
    if (ROOT_TABS.includes(pathname) || pathname === '/admin') wa.BackButton.hide();
    else wa.BackButton.show();
    wa.BackButton.onClick(onBack);
    return () => wa.BackButton.offClick(onBack);
  }, [pathname, router]);

  return <>{children}</>;
}
