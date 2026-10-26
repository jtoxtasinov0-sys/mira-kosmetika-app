'use client';
import { create } from 'zustand';

type Toast = { id: number; text: string; tone: 'ok' | 'err' | 'info' };

type ToastState = {
  toasts: Toast[];
  show: (text: string, tone?: Toast['tone']) => void;
  dismiss: (id: number) => void;
};

export const useToast = create<ToastState>((set, get) => ({
  toasts: [],
  show: (text, tone = 'ok') => {
    const id = Date.now() + Math.random();
    set({ toasts: [...get().toasts.slice(-2), { id, text, tone }] });
    setTimeout(() => get().dismiss(id), 2600);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

export const toast = (text: string, tone?: Toast['tone']) => useToast.getState().show(text, tone);
