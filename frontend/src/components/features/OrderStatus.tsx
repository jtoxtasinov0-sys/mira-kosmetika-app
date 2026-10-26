'use client';
import { Check, Clock, PackageCheck, Truck, XCircle } from 'lucide-react';
import { cn, STATUS } from '@/lib/utils';
import type { OrderStatus } from '@/lib/types';

const FLOW: { key: OrderStatus; label: string; Icon: typeof Check }[] = [
  { key: 'new', label: 'Chek tekshirilmoqda', Icon: Clock },
  { key: 'confirmed', label: 'To‘lov tasdiqlandi', Icon: Check },
  { key: 'shipped', label: 'Jo‘natildi', Icon: Truck },
  { key: 'delivered', label: 'Yetkazildi', Icon: PackageCheck },
];

export function StatusPill({ status }: { status: OrderStatus }) {
  const s = STATUS[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-extrabold', s.tone)}>
      <span className={cn('size-1.5 rounded-full', s.dot)} />
      {s.label}
    </span>
  );
}

export function StatusTimeline({ status }: { status: OrderStatus }) {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-3 rounded-3xl bg-rose-50 p-4 text-rose-700">
        <XCircle className="size-6 shrink-0" />
        <p className="text-sm font-bold">Buyurtma bekor qilingan</p>
      </div>
    );
  }
  const current = FLOW.findIndex((f) => f.key === status);
  return (
    <ol className="relative space-y-4 pl-1">
      {FLOW.map((f, i) => {
        const done = i <= current;
        return (
          <li key={f.key} className="relative flex items-center gap-3">
            {i < FLOW.length - 1 && (
              <span className={cn('absolute left-[17px] top-9 h-5 w-0.5 rounded', i < current ? 'bg-mira-magenta' : 'bg-line')} />
            )}
            <span
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-full transition',
                done ? 'bg-mira-gradient text-white shadow-glow' : 'bg-white text-muted ring-2 ring-line',
                i === current && 'animate-pop'
              )}
            >
              <f.Icon className="size-4" strokeWidth={2.4} />
            </span>
            <span className={cn('text-[14px] font-bold', done ? 'text-mira-700' : 'text-muted')}>{f.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
