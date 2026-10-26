// Boshlang'ich ma'lumotlar: kategoriyalar, 63 ta mahsulot va rasmlari
// npm run seed            — katalog bo'sh bo'lsa to'ldiradi
// npm run seed -- --reset — katalogni (mahsulot + kategoriya) o'chirib, qaytadan yozadi. Buyurtmalar saqlanib qoladi.
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import pool, { tx } from '../src/database/connection.js';
import { migrate } from '../src/database/migrate.js';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const reset = process.argv.includes('--reset');

await migrate();

const { rows } = await pool.query('SELECT count(*)::int AS n FROM products');
if (rows[0].n > 0 && !reset) {
  console.log(`Katalogda allaqachon ${rows[0].n} ta mahsulot bor. Qayta yozish uchun: npm run seed -- --reset`);
  await pool.end();
  process.exit(0);
}

const data = JSON.parse(await readFile(here('./products.json'), 'utf8'));

await tx(async (db) => {
  if (reset) {
    await db.query(`DELETE FROM products`);
    await db.query(`DELETE FROM categories`);
    await db.query(`DELETE FROM images WHERE kind IN ('product','category')
                    AND id NOT IN (SELECT image_id FROM order_items WHERE image_id IS NOT NULL)`);
  }

  const catIds = {};
  for (const [i, c] of data.categories.entries()) {
    const r = await db.query(
      `INSERT INTO categories (name, slug, emoji, sort) VALUES ($1,$2,$3,$4)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, emoji = EXCLUDED.emoji, sort = EXCLUDED.sort
       RETURNING id`,
      [c.name, c.slug, c.emoji, i]
    );
    catIds[c.slug] = r.rows[0].id;
  }

  for (const p of data.products) {
    let imageId = null;
    const file = here(`./images/${p.id}.jpg`);
    if (existsSync(file)) {
      const img = await db.query(
        `INSERT INTO images (kind, mime, data, width, height) VALUES ('product','image/jpeg',$1,800,800) RETURNING id`,
        [await readFile(file)]
      );
      imageId = img.rows[0].id;
    }
    await db.query(
      `INSERT INTO products (id, name, brand, category_id, description, price_retail, price_wholesale,
         wholesale_min, wholesale_note, price_box, box_note, image_id, is_hit, is_new, sort)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [
        p.id, p.name, p.brand, catIds[p.category], p.description, p.priceRetail, p.priceWholesale,
        p.wholesaleMin, p.wholesaleNote, p.priceBox, p.boxNote, imageId, p.isHit, p.isNew, p.sort,
      ]
    );
  }
  // Keyingi qo'shiladigan mahsulotlar uchun id ketma-ketligini to'g'rilash
  await db.query(`SELECT setval(pg_get_serial_sequence('products','id'), (SELECT coalesce(max(id),1) FROM products))`);
});

console.log(`✅ ${data.categories.length} ta kategoriya va ${data.products.length} ta mahsulot yozildi`);
await pool.end();
