'use client';
// To'lov kartasi vizuali — mijoz shu kartaga pul o'tkazadi
import { Copy } from 'lucide-react';
import { KoreaFlag, Sakura } from '@/components/ui';
import { haptic } from '@/hooks/useTelegram';
import { toast } from '@/store/toastStore';
import { formatCard } from '@/lib/utils';
import type { Settings } from '@/lib/types';

export async function copyText(text: string, label = 'Nusxalandi') {
  haptic('success');
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  toast(label);
}

export default function PaymentCard({ settings }: { settings?: Settings }) {
  const number = formatCard(settings?.card_number || '');
  const isTest = /test/i.test(`${settings?.card_holder} ${settings?.card_bank}`) || number.startsWith('4242');

  return (
    <div className="relative overflow-hidden rounded-[26px] bg-mira-gradient p-5 text-white shadow-glow">
      <div className="absolute -right-12 -top-12 size-44 rounded-full bg-mira-pink/40 blur-2xl" />
      <div className="absolute -bottom-16 -left-10 size-40 rounded-full border-[18px] border-white/10" />
      <Sakura className="absolute right-5 top-14 text-mira-200/60" size={34} />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">{settings?.card_bank || 'Bank'}</p>
          <p className="font-serif text-lg font-bold">MIRA Cosmetics</p>
        </div>
        {isTest && <span className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-extrabold tracking-wider">TEST</span>}
      </div>

      <div className="relative mt-5 flex items-center gap-3">
        <span className="h-8 w-11 rounded-md bg-[linear-gradient(135deg,#f9e2a5,#d4a94f)] opacity-90" />
        <KoreaFlag className="h-6 w-auto rounded-[3px] shadow" />
      </div>

      <button
        type="button"
        onClick={() => copyText(number.replace(/\s/g, ''), 'Karta raqami nusxalandi')}
        className="relative mt-4 flex w-full items-center justify-between gap-2 rounded-2xl bg-white/12 px-3 py-2.5 text-left backdrop-blur active:bg-white/20"
      >
        <span className="font-mono text-[19px] font-bold tracking-[0.12em]">{number || '—'}</span>
        <Copy className="size-5 shrink-0 opacity-90" />
      </button>

      <div className="relative mt-3 flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-white/60">Karta egasi</p>
          <p className="text-[14px] font-bold">{settings?.card_holder || '—'}</p>
        </div>
      </div>
    </div>
  );
}
