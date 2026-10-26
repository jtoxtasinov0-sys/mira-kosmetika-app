'use client';
// Dona / Optom narx rejimi tanlovi (sarlavhadagi tugma va savatdagi segment)
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check, Package, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useMounted } from '@/hooks/useCart';
import { KoreaFlag } from '@/components/ui';
import { haptic } from '@/hooks/useTelegram';
import { cn } from '@/lib/utils';
import type { PriceMode } from '@/lib/types';

const OPTIONS: { value: PriceMode; title: string; text: string; Icon: typeof Package }[] = [
  { value: 'retail', title: 'Dona', text: 'Bittalab xarid — chakana narx', Icon: ShoppingBag },
  { value: 'wholesale', title: 'Optom', text: "Ko'p miqdorda — arzonroq narx", Icon: Package },
];

export function ModeSwitch() {
  const mounted = useMounted();
  const mode = useCartStore((s) => s.mode);
  const setMode = useCartStore((s) => s.setMode);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = mounted ? mode : 'retail';

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-3 shadow-card active:scale-95 transition"
      >
        <span className="flex size-7 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-line">
          <KoreaFlag className="h-[18px] w-auto" />
        </span>
        <span className="text-sm font-extrabold text-mira-700">{current === 'wholesale' ? 'Optom' : 'Dona'}</span>
        <ChevronDown className={cn('size-4 text-muted transition', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 animate-fade-up rounded-3xl bg-white p-2 shadow-card">
          <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-muted">Narx turi</p>
          {OPTIONS.map(({ value, title, text, Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                haptic('select');
                setMode(value);
                setOpen(false);
              }}
              className={cn(
                'flex w-full items-center gap-3 rounded-2xl p-3 text-left transition',
                current === value ? 'bg-mira-soft' : 'active:bg-mira-50'
              )}
            >
              <span
                className={cn(
                  'flex size-10 items-center justify-center rounded-2xl',
                  current === value ? 'bg-mira-gradient text-white' : 'bg-mira-50 text-mira-500'
                )}
              >
                <Icon className="size-5" />
              </span>
              <span className="flex-1">
                <span className="block font-extrabold text-ink">{title}</span>
                <span className="block text-xs text-muted">{text}</span>
              </span>
              {current === value && <Check className="size-5 text-mira-magenta" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ModeSegment({ className }: { className?: string }) {
  const mounted = useMounted();
  const mode = useCartStore((s) => s.mode);
  const setMode = useCartStore((s) => s.setMode);
  const current = mounted ? mode : 'retail';
  return (
    <div className={cn('relative grid grid-cols-2 rounded-2xl bg-white p-1 shadow-card', className)}>
      <span
        className={cn(
          'absolute inset-y-1 w-[calc(50%-4px)] rounded-xl bg-mira-gradient shadow-glow transition-all duration-300',
          current === 'wholesale' ? 'left-[calc(50%+2px)]' : 'left-1'
        )}
      />
      {OPTIONS.map(({ value, title, Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => {
            haptic('select');
            setMode(value);
          }}
          className={cn(
            'relative z-10 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-extrabold transition-colors',
            current === value ? 'text-white' : 'text-mira-500'
          )}
        >
          <Icon className="size-4" />
          {title}
        </button>
      ))}
    </div>
  );
}
