// Rasmlar bazada (bytea) saqlanadi — Vercel'da fayl tizimi faqat o'qish uchun
import { query } from '../database/connection.js';

export const imageUrl = (id) => (id ? `/api/images/${id}` : null);

const MAX_BYTES = 3 * 1024 * 1024;

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
    const { rows } = await query(`SELECT id, kind, mime, data FROM images WHERE id = $1`, [id]);
    return rows[0] || null;
  },

  async remove(id) {
    if (!id) return;
    await query(`DELETE FROM images WHERE id = $1`, [id]);
  },
};

export default Image;
