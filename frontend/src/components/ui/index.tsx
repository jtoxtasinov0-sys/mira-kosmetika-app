'use client';
// Kichik umumiy UI qismlar
import { Minus, Plus, Flower2, ImageOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { haptic } from '@/hooks/useTelegram';
import { useToast } from '@/store/toastStore';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-2xl', className)} />;
}

const IMAGE_RETRIES = 3;

/**
 * Mahsulot rasmi: yuklanguncha skeleton, xato bo'lsa (masalan backend uyg'onayotganda) bir necha marta qayta urinadi
 */
export function ProductImage({
  src,
  alt,
  className,
  eager,
}: {
  src: string | null;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  const [state, setState] = useState({ src, attempt: 0, failed: false, loaded: false });
  if (state.src !== src) setState({ src, attempt: 0, failed: false, loaded: false });
  const imgRef = useRef<HTMLImageElement>(null);

  const url =
    src && state.attempt && !src.startsWith('data:') ? `${src}${src.includes('?') ? '&' : '?'}r=${state.attempt}` : src;

  // Gidratsiyadan oldin yuklanib bo'lgan rasmlar uchun onLoad/onError chaqirilmaydi — holatini o'zimiz tekshiramiz
  useEffect(() => {
    const img = imgRef.current;
    if (!img?.complete) return;
    if (img.naturalWidth > 0) setState((s) => (s.loaded ? s : { ...s, loaded: true }));
    else setState((s) => (s.failed ? s : { ...s, failed: true }));
  }, [url]);

  useEffect(() => {
    if (!state.failed || state.attempt >= IMAGE_RETRIES) return;
    const t = setTimeout(
      () => setState((s) => ({ ...s, attempt: s.attempt + 1, failed: false, loaded: false })),
      1500 * 2 ** state.attempt
    );
    return () => clearTimeout(t);
  }, [state.failed, state.attempt]);

  if (!src || (state.failed && state.attempt >= IMAGE_RETRIES)) {
    return (
      <div className={cn('flex items-center justify-center bg-mira-soft text-mira-200', className)}>
        <ImageOff className="size-8" />
      </div>
    );
  }
  if (state.failed) return <div className={cn('skeleton', className)} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      src={url!}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={() => setState((s) => (s.loaded ? s : { ...s, loaded: true }))}
      onError={() => setState((s) => (s.failed ? s : { ...s, failed: true }))}
      className={cn('object-cover', !state.loaded && 'skeleton text-transparent', className)}
    />
  );
}

export function QtyStepper({
  value,
  onChange,
  min = 1,
  step = 1,
  size = 'md',
  allowZero = false,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  step?: number;
  size?: 'sm' | 'md' | 'lg';
  allowZero?: boolean;
}) {
  const dims = size === 'sm' ? 'h-8 text-sm' : size === 'lg' ? 'h-13 text-lg' : 'h-10';
  const btn = size === 'sm' ? 'size-8' : size === 'lg' ? 'size-13' : 'size-10';
  const dec = () => {
    haptic('select');
    const next = value - step;
    onChange(next < min ? (allowZero ? 0 : min) : next);
  };
  const inc = () => {
    haptic('select');
    onChange(Math.min(value + step, 9999));
  };
  return (
    <div className={cn('inline-flex items-center rounded-full bg-[#f6ecff] p-0.5', dims)}>
      <button
        type="button"
        aria-label="Kamaytirish"
        onClick={dec}
        className={cn('flex items-center justify-center rounded-full text-mira-500 active:scale-90 transition', btn)}
      >
        <Minus className="size-4" strokeWidth={2.6} />
      </button>
      <input
        inputMode="numeric"
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value.replace(/\D/g, '') || '0', 10);
          onChange(Math.min(n, 9999));
        }}
        onBlur={() => value < min && !allowZero && onChange(min)}
        className="w-10 bg-transparent text-center font-extrabold text-ink outline-none"
        style={{ fontSize: 'inherit' }}
      />
      <button
        type="button"
        aria-label="Ko'paytirish"
        onClick={inc}
        className={cn(
          'flex items-center justify-center rounded-full bg-mira-gradient text-white shadow-md active:scale-90 transition',
          btn
        )}
      >
        <Plus className="size-4" strokeWidth={2.6} />
      </button>
    </div>
  );
}

export function EmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-8 py-14 text-center animate-fade-up">
      <div className="relative mb-5">
        <div className="absolute inset-0 rounded-full bg-mira-pink/25 blur-2xl" />
        <div className="relative flex size-24 items-center justify-center rounded-full bg-mira-soft">
          <Flower2 className="size-11 text-mira-magenta" strokeWidth={1.6} />
        </div>
      </div>
      <h3 className="font-serif text-2xl font-bold text-mira-700">{title}</h3>
      {text && <p className="mt-2 max-w-xs text-sm text-muted">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function SectionTitle({ title, action }: { title: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between px-4">
      <h2 className="font-serif text-[22px] font-bold leading-tight text-mira-700">{title}</h2>
      {action}
    </div>
  );
}

export function Toaster() {
  const toasts = useToast((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'animate-fade-up rounded-2xl px-4 py-3 text-sm font-semibold shadow-card glass max-w-sm',
            t.tone === 'err' ? 'text-rose-600' : t.tone === 'info' ? 'text-mira-500' : 'text-mira-700'
          )}
        >
          {t.tone === 'ok' ? '🌸 ' : t.tone === 'err' ? '⚠️ ' : ''}
          {t.text}
        </div>
      ))}
    </div>
  );
}

/** Koreya bayrog'i (Windows'da 🇰🇷 emoji ko'rinmaydi, shuning uchun SVG) */
export function KoreaFlag({ className }: { className?: string }) {
  // Trigramma: markazi (cx, cy), diagonalga perpendikulyar
  const bar = (cx: number, cy: number, rot: number, broken: boolean[]) => (
    <g transform={`translate(${cx} ${cy}) rotate(${rot})`}>
      {broken.map((b, i) =>
        b ? (
          <g key={i}>
            <rect x="-6" y={-4 + i * 3} width="5.4" height="2" />
            <rect x="0.6" y={-4 + i * 3} width="5.4" height="2" />
          </g>
        ) : (
          <rect key={i} x="-6" y={-4 + i * 3} width="12" height="2" />
        )
      )}
    </g>
  );
  return (
    <svg viewBox="0 0 90 60" className={className} aria-label="Koreya">
      <rect width="90" height="60" fill="#fff" />
      <g transform="rotate(33.69 45 30)">
        <path d="M30 30a15 15 0 0 1 30 0a7.5 7.5 0 0 1-15 0a7.5 7.5 0 0 0-15 0" fill="#CD2E3A" />
        <path d="M60 30a15 15 0 0 1-30 0a7.5 7.5 0 0 1 15 0a7.5 7.5 0 0 0 15 0" fill="#0047A0" />
      </g>
      <g fill="#000">
        {bar(21, 14, -56.31, [false, false, false])}
        {bar(69, 14, 56.31, [true, false, true])}
        {bar(21, 46, 56.31, [false, true, false])}
        {bar(69, 46, -56.31, [true, true, true])}
      </g>
    </svg>
  );
}

/** Dekorativ sakura gullari (logo motivi) */
export function Sakura({ className, size = 22 }: { className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className={className} aria-hidden>
      <g fill="currentColor">
        {[0, 72, 144, 216, 288].map((r) => (
          <path
            key={r}
            transform={`rotate(${r} 20 20)`}
            d="M20 19c-3.2-2.4-5.6-6.6-4.4-10.2.9-2.6 3.1-3.6 4.4-1.9 1.3-1.7 3.5-.7 4.4 1.9 1.2 3.6-1.2 7.8-4.4 10.2z"
          />
        ))}
      </g>
      <circle cx="20" cy="20" r="2.6" fill="#fff" opacity=".9" />
    </svg>
  );
}
