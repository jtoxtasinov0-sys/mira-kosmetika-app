// Mahsulot rasmlari: backenddan olib, Vercel CDN'da keshlaymiz (rasm id bo'yicha o'zgarmaydi).
// Shunda rasmlar Render uxlab yotganda ham darhol chiqadi; backend uyg'onayotgan bo'lsa — qayta urinamiz.
import { BACKEND_URL } from '@/lib/server';

export const maxDuration = 60;

const ID = /^[0-9a-f-]{36}$/i;
const BUDGET_MS = 55_000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!ID.test(id)) return new Response(null, { status: 404 });

  const deadline = Date.now() + BUDGET_MS;
  for (let attempt = 0; Date.now() < deadline - 1_000; attempt++) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/images/${id}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(deadline - Date.now()),
      });
      if (!res.ok && res.status < 500) {
        return new Response(null, { status: res.status, headers: { 'Cache-Control': 'public, max-age=60' } });
      }
      if (res.ok) {
        const cacheControl = res.headers.get('cache-control') || '';
        const headers = new Headers({ 'Content-Type': res.headers.get('content-type') || 'image/jpeg' });
        if (cacheControl.includes('immutable')) {
          headers.set('Cache-Control', 'public, max-age=31536000, immutable');
          headers.set('CDN-Cache-Control', 'public, max-age=31536000, immutable');
        } else {
          // Chek rasmlari — shaxsiy, CDN'da saqlanmaydi
          headers.set('Cache-Control', cacheControl || 'private, no-store');
        }
        return new Response(res.body, { headers });
      }
    } catch {
      /* tarmoq xatosi yoki vaqt tugadi */
    }
    await sleep(Math.min(1_500 * (attempt + 1), Math.max(0, deadline - Date.now())));
  }
  return new Response(null, { status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '5' } });
}
