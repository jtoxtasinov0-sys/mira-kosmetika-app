'use client';
import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { useSWRConfig } from 'swr';
import { ArrowLeft, Loader2, Save, Trash2, ExternalLink } from 'lucide-react';
import { adminFetcher, api } from '@/lib/api';
import ImageUpload from '@/components/admin/ImageUpload';
import { Skeleton } from '@/components/ui';
import { toast } from '@/store/toastStore';
import { cn } from '@/lib/utils';
import type { Category, Product } from '@/lib/types';

type Form = {
  name: string;
  brand: string;
  categoryId: string;
  description: string;
  priceRetail: string;
  priceWholesale: string;
  wholesaleMin: string;
  wholesaleNote: string;
  priceBox: string;
  boxNote: string;
  imageId: string | null;
  image: string | null;
  isHit: boolean;
  isNew: boolean;
  inStock: boolean;
  isActive: boolean;
  sort: string;
};

const EMPTY: Form = {
  name: '',
  brand: '',
  categoryId: '',
  description: '',
  priceRetail: '',
  priceWholesale: '',
  wholesaleMin: '',
  wholesaleNote: '',
  priceBox: '',
  boxNote: '',
  imageId: null,
  image: null,
  isHit: false,
  isNew: true,
  inStock: true,
  isActive: true,
  sort: '0',
};

const s = (v: number | string | null | undefined) => (v == null ? '' : String(v));

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-extrabold text-mira-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11.5px] text-muted">{hint}</span>}
    </label>
  );
}

export default function AdminProductEdit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isNew = id === 'new';
  const router = useRouter();
  const { mutate: globalMutate } = useSWRConfig();
  const { data: list } = useSWR<{ products: Product[] }>('/api/admin/products', adminFetcher);
  const { data: cats } = useSWR<{ categories: Category[] }>('/api/admin/categories', adminFetcher);
  const [f, setF] = useState<Form>(EMPTY);
  const [loaded, setLoaded] = useState(isNew);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isNew || loaded || !list) return;
    const p = list.products.find((x) => x.id === Number(id));
    if (!p) return;
    setF({
      name: p.name,
      brand: s(p.brand),
      categoryId: s(p.categoryId),
      description: s(p.description),
      priceRetail: s(p.priceRetail),
      priceWholesale: s(p.priceWholesale),
      wholesaleMin: s(p.wholesaleMin),
      wholesaleNote: s(p.wholesaleNote),
      priceBox: s(p.priceBox),
      boxNote: s(p.boxNote),
      imageId: p.imageId,
      image: p.image,
      isHit: p.isHit,
      isNew: p.isNew,
      inStock: p.inStock,
      isActive: p.isActive,
      sort: s(p.sort),
    });
    setLoaded(true);
  }, [list, id, isNew, loaded]);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF((x) => ({ ...x, [k]: e.target.value }));

  const save = async () => {
    if (!f.name.trim()) return toast('Mahsulot nomini kiriting', 'err');
    setBusy(true);
    const body = {
      name: f.name,
      brand: f.brand,
      categoryId: f.categoryId || null,
      description: f.description,
      priceRetail: f.priceRetail,
      priceWholesale: f.priceWholesale,
      wholesaleMin: f.wholesaleMin,
      wholesaleNote: f.wholesaleNote,
      priceBox: f.priceBox,
      boxNote: f.boxNote,
      imageId: f.imageId,
      isHit: f.isHit,
      isNew: f.isNew,
      inStock: f.inStock,
      isActive: f.isActive,
      sort: f.sort,
    };
    try {
      const r = await api<{ product: Product }>(isNew ? '/api/admin/products' : `/api/admin/products/${id}`, {
        method: isNew ? 'POST' : 'PATCH',
        admin: true,
        body,
      });
      await globalMutate('/api/admin/products');
      globalMutate('/api/catalog');
      toast(isNew ? 'Mahsulot qo‘shildi' : 'Saqlandi');
      if (isNew) router.replace(`/admin/products/${r.product.id}`);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Xatolik', 'err');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('Mahsulot butunlay o‘chirilsinmi? (Sotuvdan olish uchun “Sotuvda” belgisini o‘chirish kifoya)')) return;
    try {
      await api(`/api/admin/products/${id}`, { method: 'DELETE', admin: true });
      await globalMutate('/api/admin/products');
      toast('O‘chirildi');
      router.replace('/admin/products');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Xatolik', 'err');
    }
  };

  if (!loaded) {
    return list && !list.products.some((x) => x.id === Number(id)) ? (
      <div className="card p-10 text-center">
        Mahsulot topilmadi.{' '}
        <Link href="/admin/products" className="font-bold text-mira-magenta">
          Ro‘yxatga qaytish
        </Link>
      </div>
    ) : (
      <Skeleton className="h-96 rounded-3xl" />
    );
  }

  const Toggle = ({ k, label }: { k: 'isHit' | 'isNew' | 'inStock' | 'isActive'; label: string }) => (
    <button
      type="button"
      onClick={() => setF((x) => ({ ...x, [k]: !x[k] }))}
      className={cn(
        'flex items-center justify-between rounded-2xl px-4 py-3 text-[14px] font-bold transition',
        f[k] ? 'bg-mira-soft text-mira-700' : 'bg-white text-muted ring-1 ring-line'
      )}
    >
      {label}
      <span className={cn('relative h-6 w-11 rounded-full transition', f[k] ? 'bg-mira-magenta' : 'bg-line')}>
        <span className={cn('absolute top-0.5 size-5 rounded-full bg-white shadow transition-all', f[k] ? 'left-[22px]' : 'left-0.5')} />
      </span>
    </button>
  );

  return (
    <div className="space-y-5">
      <Link href="/admin/products" className="inline-flex items-center gap-1.5 text-sm font-extrabold text-mira-magenta">
        <ArrowLeft className="size-4" /> Mahsulotlar
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl font-bold text-mira-700">{isNew ? 'Yangi mahsulot' : `Mahsulot #${id}`}</h1>
        {!isNew && (
          <Link href={`/product/${id}`} target="_blank" className="btn-ghost !py-2 text-[13px]">
            <ExternalLink className="size-4" /> Do‘konda ko‘rish
          </Link>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-3">
          <ImageUpload value={f.image} onChange={(img) => setF((x) => ({ ...x, imageId: img.id, image: img.url }))} />
          <div className="grid gap-2">
            <Toggle k="isActive" label="Sotuvda (ko‘rinadi)" />
            <Toggle k="inStock" label="Omborda mavjud" />
            <Toggle k="isHit" label="🔥 Xit (mashhur)" />
            <Toggle k="isNew" label="✨ Yangi" />
          </div>
        </div>

        <div className="card space-y-4 p-5 lg:col-span-2">
          <Field label="Nomi *">
            <input className="field" value={f.name} onChange={set('name')} placeholder="Masalan: Round Lab 1025 Dokdo Toner" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Brend">
              <input className="field" value={f.brand} onChange={set('brand')} placeholder="Round Lab" />
            </Field>
            <Field label="Kategoriya">
              <select className="field" value={f.categoryId} onChange={set('categoryId')}>
                <option value="">— Tanlang —</option>
                {cats?.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Tavsif">
            <textarea className="field min-h-[90px] resize-y" value={f.description} onChange={set('description')} />
          </Field>

          <div className="rounded-3xl bg-mira-50 p-4">
            <p className="mb-3 font-serif text-lg font-bold text-mira-700">Narxlar (₩ KRW)</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Dona narxi" hint="Bo‘sh qoldirilsa — faqat optom">
                <input className="field" inputMode="numeric" value={f.priceRetail} onChange={set('priceRetail')} placeholder="12000" />
              </Field>
              <Field label="Optom narxi" hint="Bo‘sh qoldirilsa — faqat dona">
                <input className="field" inputMode="numeric" value={f.priceWholesale} onChange={set('priceWholesale')} placeholder="11000" />
              </Field>
              <Field label="Optom minimal miqdor" hint="Masalan 10 — optomda kamida 10 dona">
                <input className="field" inputMode="numeric" value={f.wholesaleMin} onChange={set('wholesaleMin')} placeholder="—" />
              </Field>
              <Field label="Optom sharti (matn)">
                <input className="field" value={f.wholesaleNote} onChange={set('wholesaleNote')} placeholder="Optom miqdori kelishiladi" />
              </Field>
              <Field label="Karobka narxi">
                <input className="field" inputMode="numeric" value={f.priceBox} onChange={set('priceBox')} placeholder="—" />
              </Field>
              <Field label="Karobka haqida">
                <input className="field" value={f.boxNote} onChange={set('boxNote')} placeholder="20 tadan 190 000" />
              </Field>
            </div>
          </div>

          <Field label="Tartib raqami" hint="Kichik raqam — ro‘yxatda yuqorida">
            <input className="field max-w-40" inputMode="numeric" value={f.sort} onChange={set('sort')} />
          </Field>

          <div className="flex flex-wrap gap-3 pt-2">
            <button onClick={save} disabled={busy} className="btn-primary flex-1">
              {busy ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />} Saqlash
            </button>
            {!isNew && (
              <button onClick={remove} className="flex items-center gap-2 rounded-2xl bg-rose-50 px-5 font-extrabold text-rose-600">
                <Trash2 className="size-4" /> O‘chirish
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
