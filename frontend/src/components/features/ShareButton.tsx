'use client';
// Ulashish: Telegram ichida — rasm + narx + tugmali tayyor xabar (shareMessage), aks holda havola
import { Share2 } from 'lucide-react';
import { api } from '@/lib/api';
import { getWebApp, haptic } from '@/hooks/useTelegram';
import { toast } from '@/store/toastStore';
import { SITE_URL, formatKRW, cn } from '@/lib/utils';
import type { Product } from '@/lib/types';

export default function ShareButton({ product, className }: { product: Product; className?: string }) {
  const share = async () => {
    haptic('light');
    const base = SITE_URL || window.location.origin;
    const url = `${base}/product/${product.id}`;
    const text = `🌸 ${product.name} — ${formatKRW(product.priceRetail ?? product.priceWholesale)} | MIRA Cosmetics`;
    const wa = getWebApp();

    if (wa) {
      // 1) Bot API 8.0+: rasm bilan tayyor xabar
      if (wa.shareMessage && wa.isVersionAtLeast('8.0')) {
        try {
          const { id } = await api<{ id: string }>(`/api/share/${product.id}`, { method: 'POST' });
          wa.shareMessage(id);
          return;
        } catch {
          /* pastdagi usulga o'tamiz */
        }
      }
      // 2) Havola — Telegram uni og:image bilan (rasm + narx) ko'rsatadi
      wa.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`);
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, text, url });
        return;
      } catch {
        /* bekor qilindi */
      }
    }
    await navigator.clipboard?.writeText(url).catch(() => {});
    toast('Havola nusxalandi');
  };

  return (
    <button
      type="button"
      onClick={share}
      aria-label="Ulashish"
      className={cn('flex size-11 items-center justify-center rounded-full bg-white/90 text-mira-700 shadow-card backdrop-blur active:scale-90 transition', className)}
    >
      <Share2 className="size-5" />
    </button>
  );
}
