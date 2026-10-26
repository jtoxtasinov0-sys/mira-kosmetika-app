// Mahsulot havolasi uchun brendli og:image (1200×630): chapda mahsulot rasmi, o'ngda nomi va narxlari
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import { BACKEND_URL, getProductServer } from '@/lib/server';
import { formatKRW } from '@/lib/utils';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'MIRA Cosmetics mahsuloti';

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getProductServer(id);
  const [logoData, font500, font800] = await Promise.all([
    readFile(path.join(process.cwd(), 'public/images/logo.png')),
    readFile(path.join(process.cwd(), 'assets/Manrope-500.ttf')),
    readFile(path.join(process.cwd(), 'assets/Manrope-800.ttf')),
  ]);
  // Shriftda ₩ belgisi yo'q — "KRW" bilan yozamiz
  const won = (n: number) => formatKRW(n).replace(' ₩', ' KRW');
  const logo = `data:image/png;base64,${logoData.toString('base64')}`;
  // Rasmni o'zimiz yuklab data URI qilamiz (next/og ichki/localhost manzillarni bloklaydi)
  let photo: string | null = null;
  if (p?.imageId) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/images/${p.imageId}`);
      if (res.ok) {
        const type = res.headers.get('content-type') || 'image/jpeg';
        photo = `data:${type};base64,${Buffer.from(await res.arrayBuffer()).toString('base64')}`;
      }
    } catch {
      /* rasm bo'lmasa logo chiqadi */
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: 'linear-gradient(135deg, #2A0759 0%, #4A0E8F 50%, #B0148C 100%)',
          padding: 48,
          fontFamily: 'Manrope',
        }}
      >
        <div
          style={{
            width: 534,
            height: 534,
            borderRadius: 40,
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            boxShadow: '0 30px 60px rgba(0,0,0,0.35)',
          }}
        >
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} width={534} height={534} style={{ objectFit: 'cover' }} alt="" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} width={360} height={360} alt="" />
          )}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingLeft: 48, color: '#fff' }}>
          <div style={{ display: 'flex', fontSize: 26, letterSpacing: 6, color: '#F7A8D8', fontWeight: 800 }}>
            {(p?.brand || 'MIRA COSMETICS').toUpperCase()}
          </div>
          <div style={{ display: 'flex', marginTop: 14, fontSize: p && p.name.length > 40 ? 44 : 54, fontWeight: 800, lineHeight: 1.12 }}>
            {p?.name || 'MIRA Cosmetics'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto', gap: 14 }}>
            {p?.priceRetail != null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.16)', borderRadius: 999, padding: '8px 20px', fontSize: 24 }}>
                  Dona
                </div>
                <div style={{ display: 'flex', fontSize: 44, fontWeight: 800 }}>{won(p.priceRetail)}</div>
              </div>
            )}
            {p?.priceWholesale != null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ display: 'flex', background: '#FF4FB8', borderRadius: 999, padding: '8px 20px', fontSize: 24, fontWeight: 800 }}>
                  Optom
                </div>
                <div style={{ display: 'flex', fontSize: 44, fontWeight: 800 }}>{won(p.priceWholesale)}</div>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 18, fontSize: 24, color: 'rgba(255,255,255,0.85)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo} width={56} height={56} style={{ borderRadius: 999 }} alt="" />
              MIRA Cosmetics · Made in Korea
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Manrope', data: font500, weight: 500, style: 'normal' },
        { name: 'Manrope', data: font800, weight: 800, style: 'normal' },
      ],
    }
  );
}
