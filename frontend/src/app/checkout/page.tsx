'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Camera, Copy, ImagePlus, Loader2, RefreshCw, Send, ShieldCheck, X } from 'lucide-react';
import { PageHeader } from '@/components/layout/Header';
import PaymentCard, { copyText } from '@/components/features/PaymentCard';
import { EmptyState, ProductImage, Skeleton } from '@/components/ui';
import { useCart } from '@/hooks/useCart';
import { useCatalog } from '@/hooks/useCatalog';
import { haptic, useTelegram } from '@/hooks/useTelegram';
import { api } from '@/lib/api';
import { toast } from '@/store/toastStore';
import { cn, compressImage, formatKRW, modeLabel, MY_ORDERS_KEY } from '@/lib/utils';
import type { Order } from '@/lib/types';

const CONTACT_KEY = 'mira-contact';


type Contact = { customerName: string; phone: string; address: string; comment: string };

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="animate-fade-up">
      <h2 className="mb-3 flex items-center gap-2.5 font-serif text-[19px] font-bold text-mira-700">
        <span className="flex size-7 items-center justify-center rounded-full bg-mira-gradient font-sans text-[13px] font-extrabold text-white">
          {n}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useTelegram();
  const { settings } = useCatalog();
  const cart = useCart();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<Contact>({ customerName: '', phone: '', address: '', comment: '' });
  const [receipt, setReceipt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CONTACT_KEY) || 'null') as Partial<Contact> | null;
      setForm((f) => ({
        ...f,
        ...saved,
        comment: '',
        customerName: saved?.customerName || [user?.first_name, user?.last_name].filter(Boolean).join(' '),
      }));
    } catch {
      /* */
    }
  }, [user]);

  if (!cart.mounted || cart.loading) {
    return (
      <div>
        <PageHeader title="Rasmiylashtirish" />
        <div className="space-y-4 p-4">
          <Skeleton className="h-48 rounded-3xl" />
          <Skeleton className="h-52 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!cart.rows.length && !done) {
    return (
      <div>
        <PageHeader title="Rasmiylashtirish" />
        <EmptyState
          title="Savat bo‘sh"
          action={
            <Link href="/catalog" className="btn-primary">
              Katalogga o‘tish
            </Link>
          }
        />
      </div>
    );
  }

  const set = (k: keyof Contact) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const valid =
    form.customerName.trim().length >= 2 &&
    /^[+\d][\d\s()-]{6,}$/.test(form.phone.trim()) &&
    form.address.trim().length >= 5 &&
    !!receipt &&
    !cart.hasProblems;

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast('Faqat rasm yuklang (skrinshot)', 'err');
    setProcessing(true);
    try {
      const { dataUrl } = await compressImage(file, 1400, 0.8);
      setReceipt(dataUrl);
      haptic('success');
    } catch {
      toast('Rasmni o‘qib bo‘lmadi, boshqasini tanlang', 'err');
    } finally {
      setProcessing(false);
    }
  };

  const submit = async () => {
    if (!valid || busy) {
      haptic('error');
      if (!receipt) toast('To‘lov chekini yuklang', 'err');
      else toast('Ma’lumotlarni to‘liq kiriting', 'err');
      return;
    }
    setBusy(true);
    try {
      const { order } = await api<{ order: Order }>('/api/orders', {
        method: 'POST',
        body: {
          ...form,
          priceMode: cart.mode,
          items: cart.items,
          receipt,
        },
      });
      localStorage.setItem(
        CONTACT_KEY,
        JSON.stringify({ customerName: form.customerName, phone: form.phone, address: form.address })
      );
      const mine = JSON.parse(localStorage.getItem(MY_ORDERS_KEY) || '[]') as string[];
      localStorage.setItem(MY_ORDERS_KEY, JSON.stringify([order.publicId, ...mine].slice(0, 30)));
      haptic('success');
      setDone(true);
      cart.clear();
      router.replace(`/orders/${order.publicId}?new=1`);
    } catch (err) {
      haptic('error');
      toast(err instanceof Error ? err.message : 'Xatolik yuz berdi', 'err');
      setBusy(false);
    }
  };

  return (
    <div className="pb-40">
      <PageHeader title="Rasmiylashtirish" />

      <div className="space-y-7 px-4 pt-3">
        {/* Buyurtma qisqacha */}
        <div className="card p-3.5">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-bold text-muted">
              {cart.count} dona · {modeLabel(cart.mode)} narx
            </p>
            <Link href="/cart" className="text-[13px] font-extrabold text-mira-magenta">
              O‘zgartirish
            </Link>
          </div>
          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
            {cart.rows.map((r) => (
              <div key={r.product.id} className="relative shrink-0">
                <ProductImage src={r.product.image} alt={r.product.name} className="size-14 rounded-2xl bg-mira-50" />
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-mira-500 px-1 text-[10px] font-extrabold text-white ring-2 ring-white">
                  {r.qty}
                </span>
              </div>
            ))}
          </div>
        </div>

        <Step n={1} title="Ma’lumotlaringiz">
          <div className="space-y-3">
            <input className="field" placeholder="Ism va familiya" value={form.customerName} onChange={set('customerName')} autoComplete="name" />
            <input
              className="field"
              placeholder="Telefon: +82 10 1234 5678"
              value={form.phone}
              onChange={set('phone')}
              inputMode="tel"
              autoComplete="tel"
            />
            <textarea
              className="field min-h-[84px] resize-none"
              placeholder="Yetkazish manzili (shahar, ko‘cha, uy, pochta indeksi)"
              value={form.address}
              onChange={set('address')}
              autoComplete="street-address"
            />
            <input className="field" placeholder="Izoh (ixtiyoriy)" value={form.comment} onChange={set('comment')} />
          </div>
        </Step>

        <Step n={2} title="Kartaga to‘lov">
          <PaymentCard settings={settings} />
          <div className="card mt-3 flex items-center justify-between p-4">
            <div>
              <p className="text-[12px] font-bold text-muted">To‘lanadigan summa</p>
              <p className="text-[24px] font-extrabold tracking-tight text-mira-700">{formatKRW(cart.total)}</p>
            </div>
            <button type="button" onClick={() => copyText(String(cart.total), 'Summa nusxalandi')} className="btn-ghost !px-3.5 !py-2.5 text-[13px]">
              <Copy className="size-4" /> Nusxa
            </button>
          </div>
          <ol className="mt-3 space-y-1.5 px-1 text-[12.5px] text-muted">
            <li>1. Yuqoridagi kartaga aynan shu summani o‘tkazing.</li>
            <li>2. O‘tkazma chekining skrinshotini pastga yuklang.</li>
            <li>3. Admin chekni tekshirib, buyurtmani tasdiqlaydi.</li>
          </ol>
        </Step>

        <Step n={3} title="To‘lov cheki">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
          {receipt ? (
            <div className="card relative overflow-hidden p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={receipt} alt="Chek" className="max-h-80 w-full rounded-[18px] object-contain bg-mira-50" />
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => fileRef.current?.click()} className="btn-ghost flex-1 !py-2.5 text-[13px]">
                  <RefreshCw className="size-4" /> Almashtirish
                </button>
                <button
                  type="button"
                  onClick={() => setReceipt(null)}
                  className="flex items-center justify-center rounded-2xl bg-rose-50 px-4 text-rose-600"
                  aria-label="O'chirish"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-mira-200 bg-white/70 px-4 py-9 text-center active:bg-mira-50"
            >
              {processing ? (
                <Loader2 className="size-9 animate-spin text-mira-magenta" />
              ) : (
                <span className="flex size-16 items-center justify-center rounded-full bg-mira-soft">
                  <ImagePlus className="size-7 text-mira-magenta" />
                </span>
              )}
              <span className="text-[15px] font-extrabold text-mira-700">Chek skrinshotini yuklash</span>
              <span className="flex items-center gap-1 text-[12px] text-muted">
                <Camera className="size-3.5" /> Galereyadan yoki kameradan
              </span>
            </button>
          )}
          <p className="mt-3 flex items-center gap-1.5 px-1 text-[11.5px] text-muted">
            <ShieldCheck className="size-4 text-emerald-500" /> Chek faqat do‘kon adminiga yuboriladi
          </p>
        </Step>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 safe-bottom">
        <div className="glass mx-auto max-w-md rounded-[28px] p-3 shadow-card ring-1 ring-white/70">
          <button type="button" onClick={submit} disabled={busy} className={cn('btn-primary w-full', !valid && 'opacity-60')}>
            {busy ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
            {busy ? 'Yuborilmoqda…' : `Buyurtmani yuborish · ${formatKRW(cart.total)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
