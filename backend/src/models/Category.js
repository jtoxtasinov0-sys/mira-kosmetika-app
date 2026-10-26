import { query } from '../database/connection.js';
import { imageUrl } from './Image.js';

const toJson = (r) => ({
  id: r.id,
  name: r.name,
  slug: r.slug,
  emoji: r.emoji,
  image: imageUrl(r.image_id || r.fallback_image_id),
  imageId: r.image_id,
  sort: r.sort,
  count: Number(r.count || 0),
});

export const slugify = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[ʻʼ'’`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || `cat-${Date.now()}`;

const Category = {
  /** Kategoriyalar + faol mahsulotlar soni + rasm bo'lmasa birinchi mahsulot rasmi */
  async list() {
    const { rows } = await query(`
      SELECT c.*,
        (SELECT count(*) FROM products p WHERE p.category_id = c.id AND p.is_active) AS count,
        (SELECT p.image_id FROM products p
          WHERE p.category_id = c.id AND p.is_active AND p.image_id IS NOT NULL
          ORDER BY p.is_hit DESC, p.sort, p.id LIMIT 1) AS fallback_image_id
      FROM categories c
      ORDER BY c.sort, c.id`);
    return rows.map(toJson);
  },

  async create({ name, emoji = null, imageId = null, sort = 0 }) {
    const { rows } = await query(
      `INSERT INTO categories (name, slug, emoji, image_id, sort) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, `${slugify(name)}-${Date.now().toString(36)}`, emoji, imageId, sort]
    );
    return toJson(rows[0]);
  },

  async update(id, { name, emoji, imageId, sort }) {
    const { rows } = await query(
      `UPDATE categories SET
         name = COALESCE($2, name),
         emoji = COALESCE($3, emoji),
         image_id = CASE WHEN $5 THEN $4::uuid ELSE image_id END,
         sort = COALESCE($6, sort)
       WHERE id = $1 RETURNING *`,
      [id, name ?? null, emoji ?? null, imageId ?? null, imageId !== undefined, sort ?? null]
    );
    return rows[0] ? toJson(rows[0]) : null;
  },

  async remove(id) {
    await query(`DELETE FROM categories WHERE id = $1`, [id]);
  },
};

export default Category;
