'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, CreditCard, Megaphone, Package, Truck } from 'lucide-react';
import { ProductImage, Sakura } from '@/components/ui';
import { useCartStore } from '@/store/cartStore';
import { haptic } from '@/hooks/useTelegram';
import { toast } from '@/store/toastStore';
import { cn } from '@/lib/utils';
import type { Product } from '@/lib/types';

function FloatingProducts({ products }: { products: Product[] }) {
  const [a, b] = products.filter((p) => p.image);
  return (
    <div className="pointer-events-none absolute -right-3 bottom-0 top-0 w-[46%]">
      {a && (
        <ProductImage
          src={a.image}
          alt=""
          eager
          className="absolute right-6 top-5 size-[104px] rotate-6 rounded-[26px] bg-white shadow-2xl ring-4 ring-white/25"
        />
      )}
      {b && (
        <ProductImage
          src={b.image}
          alt=""
          eager
          className="absolute bottom-5 right-[92px] size-[84px] -rotate-6 rounded-[22px] bg-white shadow-2xl ring-4 ring-white/25"
        />
      )}
    </div>
  );
}

export function HeroCarousel({ hits, fresh }: { hits: Product[]; fresh: Product[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const setMode = useCartStore((s) => s.setMode);
  const SLIDES = 3;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => setIdx(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener('scroll', onScroll, { passive: true });
    const t = setInterval(() => {
      const next = (Math.round(el.scrollLeft / el.clientWidth) + 1) % SLIDES;
      el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' });
    }, 5500);
    return () => {
      el.removeEventListener('scroll', onScroll);
      clearInterval(t);
    };
  }, []);

  const slide = 'relative min-h-[186px] w-full shrink-0 snap-center overflow-hidden rounded-[28px] p-5 text-white';

  return (
    <div className="px-4">
      <div ref={ref} className="no-scrollbar flex snap-x snap-mandatory gap-0 overflow-x-auto rounded-[28px] shadow-glow">
        {/* 1 — Made in Korea */}
        <div className={cn(slide, 'bg-mira-gradient')}>
          <div className="absolute -left-10 -top-16 size-48 rounded-full bg-mira-pink/30 blur-3xl" />
          <Sakura className="absolute right-[46%] top-3 animate-float text-mira-200/80" size={26} />
          <Sakura className="absolute bottom-4 right-4 animate-float text-mira-pink/70 [animation-delay:1.5s]" size={20} />
          <FloatingProducts products={hits} />
          <div className="relative max-w-[58%]">
            <p className="font-serif text-[15px] italic text-mira-200">Made in Korea</p>
            <h2 className="mt-1 font-serif text-[22px] font-bold leading-[1.12]">Koreyadan to‘g‘ridan-to‘g‘ri</h2>
            <p className="mt-1.5 text-[12px] leading-snug text-white/80">Original kosmetika, vitamin va kollagenlar</p>
            <Link
              href="/catalog"
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-extrabold text-mira-700 active:scale-95 transition"
            >
              Katalog <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* 2 — Optom */}
        <div className={cn(slide, 'bg-pink-gradient')}>
          <div className="absolute -right-10 -top-10 size-44 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute bottom-[-30px] right-[-10px] flex size-40 items-center justify-center rounded-full border-[14px] border-white/15">
            <Package className="size-14 text-white/85" strokeWidth={1.4} />
          </div>
          <div className="relative max-w-[64%]">
            <p className="font-serif text-[15px] italic text-white/85">Optomchilar uchun</p>
            <h2 className="mt-1 font-serif text-[22px] font-bold leading-[1.12]">Ulgurji narxlar</h2>
            <p className="mt-1.5 text-[12px] leading-snug text-white/85">“Optom” rejimini yoqing — narxlar darhol o‘zgaradi</p>
            <button
              type="button"
              onClick={() => {
                haptic('success');
                setMode('wholesale');
                toast('Optom narxlar yoqildi');
              }}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-extrabold text-mira-magenta active:scale-95 transition"
            >
              Optomga o‘tish <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>

        {/* 3 — Yangi kelganlar */}
        <div className={cn(slide, 'bg-[linear-gradient(135deg,#1e1033_0%,#4a0e8f_70%,#7a2bb8_100%)]')}>
          <div className="absolute -bottom-16 -left-10 size-48 rounded-full bg-mira-magenta/40 blur-3xl" />
          <FloatingProducts products={fresh} />
          <div className="relative max-w-[58%]">
            <p className="font-serif text-[15px] italic text-mira-200">Yangi partiya</p>
            <h2 className="mt-1 font-serif text-[22px] font-bold leading-[1.12]">Yangi kelgan mahsulotlar</h2>
            <Link
              href="/catalog?filter=new"
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-extrabold text-mira-700 active:scale-95 transition"
            >
              Ko‘rish <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>
      <div className="mt-2.5 flex justify-center gap-1.5">
        {Array.from({ length: SLIDES }).map((_, i) => (
          <span
            key={i}
            className={cn('h-1.5 rounded-full transition-all duration-300', i === idx ? 'w-6 bg-mira-magenta' : 'w-1.5 bg-mira-200')}
          />
        ))}
      </div>
    </div>
  );
}

export function InfoCards({ deliveryNote }: { deliveryNote?: string }) {
  const items = [
    { Icon: CreditCard, title: "Karta orqali to'lov", text: 'Chekni yuklang — tez tasdiqlaymiz', tone: 'bg-[#f3e9ff] text-mira-500' },
    { Icon: Package, title: 'Optom va dona', text: 'Ikki xil narx — o‘zingiz tanlang', tone: 'bg-[#ffe6f4] text-mira-magenta' },
    { Icon: Truck, title: 'Yetkazib berish', text: deliveryNote?.split('.')[0] || 'Koreya bo‘ylab', tone: 'bg-[#fff0e8] text-[#c2410c]' },
  ];
  return (
    <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-1">
      {items.map(({ Icon, title, text, tone }) => (
        <div key={title} className="card flex w-[232px] shrink-0 items-center gap-3 p-3.5">
          <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-2xl', tone)}>
            <Icon className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-[13.5px] font-extrabold text-ink">{title}</span>
            <span className="line-clamp-2 block text-[11.5px] leading-snug text-muted">{text}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

export function Announcement({ text }: { text?: string }) {
  if (!text) return null;
  const line = `${text}   🌸   `;
  return (
    <div className="mx-4 flex items-center gap-2.5 overflow-hidden rounded-2xl bg-white/70 py-2.5 pl-3 shadow-card ring-1 ring-mira-100">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-mira-soft">
        <Megaphone className="size-3.5 text-mira-magenta" />
      </span>
      <div className="relative flex-1 overflow-hidden">
        <div className="flex w-max animate-marquee whitespace-nowrap text-[13px] font-semibold text-mira-700">
          <span className="pr-8">{line.repeat(2)}</span>
          <span className="pr-8">{line.repeat(2)}</span>
        </div>
      </div>
    </div>
  );
}
