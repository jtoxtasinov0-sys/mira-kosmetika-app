'use client';
// window.Telegram.WebApp obyekti uchun hook
import { useSyncExternalStore } from 'react';

export type TgUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
};

type Haptic = {
  impactOccurred: (s: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
  notificationOccurred: (s: 'error' | 'success' | 'warning') => void;
  selectionChanged: () => void;
};

export type TgWebApp = {
  initData: string;
  initDataUnsafe: { user?: TgUser; start_param?: string };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  isVersionAtLeast: (v: string) => boolean;
  ready: () => void;
  expand: () => void;
  close: () => void;
  setHeaderColor: (c: string) => void;
  setBackgroundColor: (c: string) => void;
  setBottomBarColor?: (c: string) => void;
  disableVerticalSwipes?: () => void;
  enableClosingConfirmation?: () => void;
  openLink: (url: string, opts?: { try_instant_view?: boolean }) => void;
  openTelegramLink: (url: string) => void;
  shareMessage?: (id: string, cb?: (sent: boolean) => void) => void;
  showAlert: (msg: string, cb?: () => void) => void;
  BackButton: { show: () => void; hide: () => void; onClick: (cb: () => void) => void; offClick: (cb: () => void) => void };
  HapticFeedback: Haptic;
};

declare global {
  interface Window {
    Telegram?: { WebApp?: TgWebApp };
  }
}

/** Haqiqiy Telegram muhitida initData bo'sh bo'lmaydi */
export function getWebApp(): TgWebApp | null {
  if (typeof window === 'undefined') return null;
  const wa = window.Telegram?.WebApp;
  return wa && wa.initData ? wa : null;
}

export const getInitData = () => getWebApp()?.initData || '';

export function haptic(kind: 'light' | 'medium' | 'success' | 'error' | 'select' = 'light') {
  const h = getWebApp()?.HapticFeedback;
  if (!h) return;
  try {
    if (kind === 'success' || kind === 'error') h.notificationOccurred(kind);
    else if (kind === 'select') h.selectionChanged();
    else h.impactOccurred(kind);
  } catch {
    /* eski versiyalar */
  }
}

const subscribe = () => () => {};

export function useTelegram() {
  // Telegram skripti layout'da oldindan yuklanadi; server render'da null
  const webApp = useSyncExternalStore(subscribe, getWebApp, () => null);
  return {
    webApp,
    isTelegram: !!webApp,
    user: webApp?.initDataUnsafe.user ?? null,
    initData: webApp?.initData ?? '',
  };
}
