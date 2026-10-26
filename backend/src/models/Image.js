// Rasmlar bazada (bytea) saqlanadi — Vercel'da fayl tizimi faqat o'qish uchun
import { query } from '../database/connection.js';

export const imageUrl = (id) => (id ? `/api/images/${id}` : null);

const MAX_BYTES = 3 * 1024 * 1024;

// Rasm id bo'yicha o'zgarmaydi — mahsulot/kategoriya rasmlarini xotirada saqlaymiz,
// shunda har bir rasm uchun bazaga borilmaydi (bosh sahifada o'nlab rasm bir vaqtda so'raladi)
const CACHE_LIMIT = 40 * 1024 * 1024;
const cache = new Map();
let cacheBytes = 0;

function remember(img) {
  if (img.kind === 'receipt' || img.data.length > CACHE_LIMIT / 4) return;
  while (cacheBytes + img.data.length > CACHE_LIMIT && cache.size) {
    const [oldId, old] = cache.entries().next().value;
    cache.delete(oldId);
    cacheBytes -= old.data.length;
  }
  cache.set(img.id, img);
  cacheBytes += img.data.length;
}

function forget(id) {
  const img = cache.get(id);
  if (!img) return;
  cache.delete(id);
  cacheBytes -= img.data.length;
}

/** data:image/jpeg;base64,... ko'rinishidagi satrni Buffer'ga aylantiradi */
export function parseDataUrl(dataUrl) {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl || '');
  if (!m) return null;
  const buf = Buffer.from(m[2], 'base64');
  if (!buf.length || buf.length > MAX_BYTES) return null;
  return { mime: m[1], data: buf };
}

const Image = {
  async create({ kind = 'product', mime, data, width = null, height = null }, db = { query }) {
    const { rows } = await db.query(
      `INSERT INTO images (kind, mime, data, width, height) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [kind, mime, data, width, height]
    );
    return rows[0].id;
  },

  async get(id) {
    if (!/^[0-9a-f-]{36}$/i.test(id || '')) return null;
    const key = id.toLowerCase();
    const hit = cache.get(key);
    if (hit) return hit;
    const { rows } = await query(`SELECT id, kind, mime, data FROM images WHERE id = $1`, [key]);
    if (rows[0]) remember(rows[0]);
    return rows[0] || null;
  },

  async remove(id) {
    if (!id) return;
    forget(String(id).toLowerCase());
    await query(`DELETE FROM images WHERE id = $1`, [id]);
  },
};

export default Image;
