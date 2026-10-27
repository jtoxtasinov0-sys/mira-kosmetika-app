// Bir martalik ma'lumot tozalash — server ishga tushganda chaqiriladi, bajarilgani settings jadvalida belgilanadi
import { tx } from './connection.js';
import logger from '../utils/logger.js';

const DONE_KEY = 'cleanup:mira-48h-fresh';

/** Haqiqiy rasmi yo'q (logotipli vaqtinchalik rasm) MIRA 48H Fresh dezodorantlarini o'chirish */
export async function removeMira48hFresh() {
  const removed = await tx(async (db) => {
    const done = await db.query(`SELECT 1 FROM settings WHERE key = $1 FOR UPDATE`, [DONE_KEY]);
    if (done.rowCount) return null;

    const { rows } = await db.query(
      `DELETE FROM products WHERE name ILIKE 'MIRA 48H Fresh%' RETURNING id, name, image_id`
    );
    const imageIds = rows.map((r) => r.image_id).filter(Boolean);
    if (imageIds.length) {
      // Buyurtmalarda ishlatilgan rasmlar saqlanib qoladi
      await db.query(
        `DELETE FROM images WHERE id = ANY($1::uuid[])
           AND id NOT IN (SELECT image_id FROM order_items WHERE image_id IS NOT NULL)`,
        [imageIds]
      );
    }
    await db.query(`INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`, [
      DONE_KEY,
      new Date().toISOString(),
    ]);
    return rows;
  });
  if (removed) logger.info(`Tozalash: ${removed.length} ta mahsulot o'chirildi — ${removed.map((r) => `#${r.id}`).join(', ') || 'yo‘q'}`);
}
