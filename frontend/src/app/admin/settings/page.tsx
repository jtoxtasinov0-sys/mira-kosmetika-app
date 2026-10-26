'use client';
import { useEffect, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { Bot, CheckCircle2, Loader2, Save, AlertTriangle, Link2 } from 'lucide-react';
import { adminFetcher, api } from '@/lib/api';
import PaymentCard from '@/components/features/PaymentCard';
import { Skeleton } from '@/components/ui';
import { toast } from '@/store/toastStore';
import type { Settings } from '@/lib/types';

type BotStatus = {
  enabled: boolean;
  username?: string;
  name?: string;
  error?: string;
  webhook?: { url: string; pending: number; lastError?: string };
  adminChatIds: string[];
  webappUrl?: string;
};

const FIELDS: { key: keyof Settings; label: string; hint?: string; textarea?: boolean }[] = [
  { key: 'card_number', label: 'Karta raqami', hint: 'Mijozlar shu kartaga to‘lov qiladi' },
  { key: 'card_holder', label: 'Karta egasi' },
  { key: 'card_bank', label: 'Bank nomi' },
  { key: 'contact_phone', label: 'Aloqa telefoni' },
  { key: 'contact_username', label: 'Admin Telegram username', hint: '@ belgisisiz, masalan: mira_admin' },
  { key: 'announcement', label: 'E’lon (bosh sahifadagi yuguruvchi qator)', textarea: true },
  { key: 'delivery_note', label: 'Yetkazib berish haqida', textarea: true },
];

export default function AdminSettingsPage() {
  const { mutate: globalMutate } = useSWRConfig();
  const { data } = useSWR<{ settings: Settings }>('/api/admin/settings', adminFetcher);
  const { data: bot, mutate: mutateBot } = useSWR<BotStatus>('/api/admin/bot', adminFetcher);
  const [f, setF] = useState<Settings | null>(null);
  const [busy, setBusy] = useState(false);
  const [botBusy, setBotBusy] = useState(false);

  useEffect(() => {
    if (data && !f) setF(data.settings);
  }, [data, f]);

  const save = async () => {
    if (!f) return;
    setBusy(true);
    try {
      const r = await api<{ settings: Settings }>('/api/admin/settings', { method: 'PUT', admin: true, body: f });
      setF(r.settings);
      globalMutate('/api/catalog');
      toast('Sozlamalar saqlandi');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Xatolik', 'err');
    } finally {
      setBusy(false);
    }
  };

  const setupBot = async () => {
    setBotBusy(true);
    try {
      const r = await api<{ webhook: string }>('/api/admin/bot/setup', { method: 'POST', admin: true });
      toast(`Bot ulandi: ${r.webhook}`);
      mutateBot();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Xatolik', 'err');
    } finally {
      setBotBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-3xl font-bold text-mira-700">Sozlamalar</h1>
        <p className="text-sm text-muted">To‘lov kartasi, aloqa va Telegram bot</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="card space-y-4 p-5 lg:col-span-3">
          {!f ? (
            <Skeleton className="h-96 rounded-3xl" />
          ) : (
            <>
              {FIELDS.map(({ key, label, hint, textarea }) => (
                <label key={key} className="block">
                  <span className="mb-1.5 block text-[13px] font-extrabold text-mira-700">{label}</span>
                  {textarea ? (
                    <textarea
                      className="field min-h-[80px] resize-y"
                      value={f[key] ?? ''}
                      onChange={(e) => setF({ ...f, [key]: e.target.value })}
                    />
                  ) : (
                    <input className="field" value={f[key] ?? ''} onChange={(e) => setF({ ...f, [key]: e.target.value })} />
                  )}
                  {hint && <span className="mt-1 block text-[11.5px] text-muted">{hint}</span>}
                </label>
              ))}
              <button onClick={save} disabled={busy} className="btn-primary w-full">
                {busy ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />} Saqlash
              </button>
            </>
          )}
        </div>

        <div className="space-y-5 lg:col-span-2">
          <div>
            <p className="mb-2 text-[13px] font-extrabold uppercase tracking-wider text-muted">Mijoz ko‘radigan karta</p>
            <PaymentCard settings={f ?? undefined} />
          </div>

          <div className="card space-y-3 p-5">
            <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-mira-700">
              <Bot className="size-5" /> Telegram bot
            </h2>
            {!bot ? (
              <Skeleton className="h-24 rounded-2xl" />
            ) : bot.enabled ? (
              <>
                <p className="flex items-center gap-2 text-sm font-bold text-emerald-600">
                  <CheckCircle2 className="size-4" /> @{bot.username} ishlayapti
                </p>
                <p className="break-all text-[12.5px] text-muted">
                  Webhook: {bot.webhook?.url || 'o‘rnatilmagan (lokal rejimda polling)'}
                  {bot.webhook?.lastError && <span className="block text-rose-600">Xato: {bot.webhook.lastError}</span>}
                </p>
                <p className="text-[12.5px] text-muted">
                  Buyurtma xabarlari keladigan chatlar:{' '}
                  <b className="text-ink">{bot.adminChatIds.length ? bot.adminChatIds.join(', ') : 'yo‘q — ADMIN_CHAT_IDS ni kiriting'}</b>
                </p>
                <button onClick={setupBot} disabled={botBusy} className="btn-ghost w-full">
                  {botBusy ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />} Botni ulash (webhook + menyu)
                </button>
                <p className="text-[11.5px] text-muted">Vercel’ga joylagandan keyin bir marta bosing.</p>
              </>
            ) : (
              <div className="rounded-2xl bg-amber-50 p-3 text-[13px] text-amber-800">
                <p className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="size-4" /> Bot ulanmagan
                </p>
                <p className="mt-1">
                  {bot.error || 'backend/.env faylida BOT_TOKEN va ADMIN_CHAT_IDS ni kiriting (BotFather’dan token oling).'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
