import { query } from '../database/connection.js';
import { imageUrl } from './Image.js';

export const toJson = (r) => ({
  id: r.id,
  name: r.name,
  brand: r.brand,
  categoryId: r.category_id,
  categoryName: r.category_name ?? undefined,
  description: r.description,
  priceRetail: r.price_retail,
  priceWholesale: r.price_wholesale,
  wholesaleMin: r.wholesale_min,
  wholesaleNote: r.wholesale_note,
  priceBox: r.price_box,
  boxNote: r.box_note,
  image: imageUrl(r.image_id),
  imageId: r.image_id,
  isHit: r.is_hit,
  isNew: r.is_new,
  inStock: r.in_stock,
  isActive: r.is_active,
  sort: r.sort,
});

// API maydoni -> ustun nomi
const FIELDS = {
  name: 'name',
  brand: 'brand',
  categoryId: 'category_id',
  description: 'description',
  priceRetail: 'price_retail',
  priceWholesale: 'price_wholesale',
  wholesaleMin: 'wholesale_min',
  wholesaleNote: 'wholesale_note',
  priceBox: 'price_box',
  boxNote: 'box_note',
  imageId: 'image_id',
  isHit: 'is_hit',
  isNew: 'is_new',
  inStock: 'in_stock',
  isActive: 'is_active',
  sort: 'sort',
};

const BASE = `
  SELECT p.*, c.name AS category_name
  FROM products p LEFT JOIN categories c ON c.id = p.category_id`;

const Product = {
  async list({ includeInactive = false } = {}) {
    const { rows } = await query(
      `${BASE} ${includeInactive ? '' : 'WHERE p.is_active'} ORDER BY p.sort, p.id`
    );
    return rows.map(toJson);
  },

  async get(id, { includeInactive = false } = {}) {
    if (!Number.isInteger(Number(id))) return null;
    const { rows } = await query(
      `${BASE} WHERE p.id = $1 ${includeInactive ? '' : 'AND p.is_active'}`,
      [Number(id)]
    );
    return rows[0] ? toJson(rows[0]) : null;
  },

  /** Buyurtma uchun xom qatorlar (narxlarni serverda qayta hisoblash) */
  async getMany(ids) {
    if (!ids.length) return [];
    const { rows } = await query(`SELECT * FROM products WHERE id = ANY($1::int[]) AND is_active`, [ids]);
    return rows;
  },

  async search(q, limit = 20) {
    const { rows } = await query(
      `${BASE} WHERE p.is_active AND (p.name ILIKE $1 OR p.brand ILIKE $1 OR c.name ILIKE $1)
       ORDER BY p.is_hit DESC, p.id LIMIT $2`,
      [`%${q}%`, limit]
    );
    return rows.map(toJson);
  },

  async create(data) {
    const cols = [];
    const vals = [];
    for (const [k, col] of Object.entries(FIELDS)) {
      if (data[k] !== undefined) {
        cols.push(col);
        vals.push(data[k]);
      }
    }
    const { rows } = await query(
      `INSERT INTO products (${cols.join(',')}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(',')}) RETURNING id`,
      vals
    );
    return Product.get(rows[0].id, { includeInactive: true });
  },

  async update(id, data) {
    const sets = [];
    const vals = [Number(id)];
    for (const [k, col] of Object.entries(FIELDS)) {
      if (data[k] !== undefined) {
        vals.push(data[k]);
        sets.push(`${col} = $${vals.length}`);
      }
    }
    if (sets.length) {
      await query(`UPDATE products SET ${sets.join(', ')}, updated_at = now() WHERE id = $1`, vals);
    }
    return Product.get(id, { includeInactive: true });
  },

  async remove(id) {
    const { rows } = await query(`DELETE FROM products WHERE id = $1 RETURNING image_id`, [Number(id)]);
    return rows[0] || null;
  },
};

export default Product;
