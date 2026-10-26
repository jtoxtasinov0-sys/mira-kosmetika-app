'use client';
import { useState } from 'react';
import useSWR from 'swr';
import { Check, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { adminFetcher, api } from '@/lib/api';
import ImageUpload from '@/components/admin/ImageUpload';
import { ProductImage, Skeleton } from '@/components/ui';
import { toast } from '@/store/toastStore';
import type { Category } from '@/lib/types';

type Draft = { id?: number; name: string; emoji: string; sort: string; imageId: string | null; image: string | null };
const EMPTY: Draft = { name: '', emoji: '', sort: '0', imageId: null, image: null };

export default function AdminCategoriesPage() {
  const { data, mutate } = useSWR<{ categories: Category[] }>('/api/admin/categories', adminFetcher);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!draft?.name.trim()) return toast('Nomini kiriting', 'err');
    setBusy(true);
    try {
      const body = { name: draft.name, emoji: draft.emoji, sort: draft.sort, imageId: draft.imageId };
      await api(draft.id ? `/api/admin/categories/${draft.id}` : '/api/admin/categories', {
        method: draft.id ? 'PATCH' : 'POST',
        admin: true,
        body,
      });
      await mutate();
      setDraft(null);
      toast('Saqlandi');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Xatolik', 'err');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (c: Category) => {
    if (!window.confirm(`“${c.name}” o‘chirilsinmi? Undagi ${c.count} ta mahsulot kategoriyasiz qoladi.`)) return;
    await api(`/api/admin/categories/${c.id}`, { method: 'DELETE', admin: true });
    mutate();
    toast('O‘chirildi');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-bold text-mira-700">Kategoriyalar</h1>
          <p className="text-sm text-muted">Rasm qo‘yilmasa — kategoriyadagi birinchi mahsulot rasmi ko‘rsatiladi</p>
        </div>
        <button onClick={() => setDraft(EMPTY)} className="btn-primary !py-3">
          <Plus className="size-5" /> Yangi kategoriya
        </button>
      </div>

      {draft && (
        <div className="card grid gap-4 p-5 sm:grid-cols-[160px_1fr] animate-fade-up">
          <ImageUpload
            kind="category"
            value={draft.image}
            onChange={(img) => setDraft((d) => d && { ...d, imageId: img.id, image: img.url })}
          />
          <div className="space-y-3">
            <div className="grid grid-cols-[90px_1fr] gap-3">
              <input className="field text-center" value={draft.emoji} onChange={(e) => setDraft({ ...draft, emoji: e.target.value })} placeholder="🌸" />
              <input className="field" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Kategoriya nomi" />
            </div>
            <input className="field max-w-40" inputMode="numeric" value={draft.sort} onChange={(e) => setDraft({ ...draft, sort: e.target.value })} placeholder="Tartib" />
            <div className="flex gap-2">
              <button onClick={save} disabled={busy} className="btn-primary">
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Saqlash
              </button>
              <button onClick={() => setDraft(null)} className="btn-ghost">
                <X className="size-4" /> Bekor
              </button>
            </div>
          </div>
        </div>
      )}

      {!data ? (
        <Skeleton className="h-64 rounded-3xl" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {data.categories.map((c) => (
            <div key={c.id} className="card flex items-center gap-3 p-3">
              <ProductImage src={c.image} alt={c.name} className="size-16 shrink-0 rounded-2xl bg-mira-50" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-extrabold">
                  {c.emoji} {c.name}
                </p>
                <p className="text-[12px] text-muted">
                  {c.count} ta mahsulot · tartib {c.sort}
                </p>
              </div>
              <button
                onClick={() =>
                  setDraft({ id: c.id, name: c.name, emoji: c.emoji ?? '', sort: String(c.sort), imageId: c.imageId, image: c.imageId ? c.image : null })
                }
                className="flex size-9 items-center justify-center rounded-xl bg-mira-soft text-mira-500"
                aria-label="Tahrirlash"
              >
                <Pencil className="size-4" />
              </button>
              <button onClick={() => remove(c)} className="flex size-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600" aria-label="O'chirish">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
