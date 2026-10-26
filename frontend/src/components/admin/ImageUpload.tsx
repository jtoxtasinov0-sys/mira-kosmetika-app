'use client';
// Admin: rasm tanlash -> brauzerda kvadrat 900px JPEG -> /api/admin/images
import { useRef, useState } from 'react';
import { ImagePlus, Loader2, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from '@/store/toastStore';
import { cn, squareImage } from '@/lib/utils';

export default function ImageUpload({
  value,
  onChange,
  kind = 'product',
  className,
}: {
  value: string | null;
  onChange: (img: { id: string; url: string }) => void;
  kind?: 'product' | 'category';
  className?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const { dataUrl, width, height } = await squareImage(file, 900, 0.85);
      const img = await api<{ id: string; url: string }>('/api/admin/images', {
        method: 'POST',
        admin: true,
        body: { dataUrl, kind, width, height },
      });
      onChange(img);
      toast('Rasm yuklandi');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Rasm yuklanmadi', 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn('relative', className)}>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={onFile} />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="group relative block aspect-square w-full overflow-hidden rounded-3xl border-2 border-dashed border-mira-200 bg-white"
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="size-full object-cover" />
        ) : (
          <span className="flex size-full flex-col items-center justify-center gap-2 text-mira-magenta">
            <ImagePlus className="size-9" />
            <span className="text-sm font-bold">Rasm yuklash</span>
          </span>
        )}
        {value && (
          <span className="absolute inset-x-3 bottom-3 flex items-center justify-center gap-1.5 rounded-full bg-white/90 py-2 text-xs font-extrabold text-mira-700 opacity-90">
            <RefreshCw className="size-3.5" /> Almashtirish
          </span>
        )}
        {busy && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/70">
            <Loader2 className="size-8 animate-spin text-mira-magenta" />
          </span>
        )}
      </button>
    </div>
  );
}
