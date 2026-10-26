import { query, tx } from '../database/connection.js';
import { imageUrl } from './Image.js';

export const STATUSES = ['new', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export const STATUS_LABELS = {
  new: '🆕 Yangi',
  confirmed: "✅ To'lov tasdiqlandi",
  shipped: "🚚 Jo'natildi",
  delivered: '📦 Yetkazildi',
  cancelled: '❌ Bekor qilindi',
};

const itemJson = (i) => ({
  id: i.id,
  productId: i.product_id,
  name: i.name,
  brand: i.brand,
  image: imageUrl(i.image_id),
  imageId: i.image_id,
  price: i.price,
  qty: i.qty,
  subtotal: i.subtotal,
});

export const toJson = (o, items = []) => ({
  id: o.id,
  publicId: o.public_id,
  userId: o.user_id,
  username: o.username ?? undefined,
  customerName: o.customer_name,
  phone: o.phone,
  address: o.address,
  comment: o.comment,
  priceMode: o.price_mode,
  itemsCount: o.items_count,
  total: o.total,
  status: o.status,
  receipt: imageUrl(o.receipt_image_id),
  receiptImageId: o.receipt_image_id,
  paymentCard: o.payment_card,
  adminNote: o.admin_note,
  createdAt: o.created_at,
  updatedAt: o.updated_at,
  items: items.map(itemJson),
});

async function withItems(orders) {
  if (!orders.length) return [];
  const { rows } = await query(
    `SELECT * FROM order_items WHERE order_id = ANY($1::int[]) ORDER BY id`,
    [orders.map((o) => o.id)]
  );
  return orders.map((o) => toJson(o, rows.filter((i) => i.order_id === o.id)));
}

const Order = {
  /** Buyurtma + mahsulotlarni bitta tranzaksiyada saqlash */
  async create(order, items) {
    return tx(async (db) => {
      const { rows } = await db.query(
        `INSERT INTO orders (user_id, customer_name, phone, address, comment, price_mode,
                             items_count, total, receipt_image_id, payment_card)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [
          order.userId || null,
          order.customerName,
          order.phone,
          order.address || null,
          order.comment || null,
          order.priceMode,
          items.reduce((s, i) => s + i.qty, 0),
          items.reduce((s, i) => s + i.subtotal, 0),
          order.receiptImageId || null,
          order.paymentCard || null,
        ]
      );
      const o = rows[0];
      const saved = [];
      for (const i of items) {
        const r = await db.query(
          `INSERT INTO order_items (order_id, product_id, name, brand, image_id, price, qty, subtotal)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
          [o.id, i.productId, i.name, i.brand, i.imageId, i.price, i.qty, i.subtotal]
        );
        saved.push(r.rows[0]);
      }
      return toJson(o, saved);
    });
  },

  async get(id) {
    const { rows } = await query(
      `SELECT o.*, u.username FROM orders o LEFT JOIN users u ON u.id = o.user_id WHERE o.id = $1`,
      [Number(id)]
    );
    return (await withItems(rows))[0] || null;
  },

  async getByPublicId(publicId) {
    if (!/^[0-9a-f-]{36}$/i.test(publicId || '')) return null;
    const { rows } = await query(`SELECT * FROM orders WHERE public_id = $1`, [publicId]);
    return (await withItems(rows))[0] || null;
  },

  async listByUser(userId, limit = 30) {
    const { rows } = await query(
      `SELECT * FROM orders WHERE user_id = $1 ORDER BY id DESC LIMIT $2`,
      [userId, limit]
    );
    return withItems(rows);
  },

  async list({ status, q, limit = 50, offset = 0 } = {}) {
    const where = [];
    const vals = [];
    if (status && STATUSES.includes(status)) {
      vals.push(status);
      where.push(`o.status = $${vals.length}`);
    }
    if (q) {
      vals.push(`%${q}%`);
      where.push(
        `(o.customer_name ILIKE $${vals.length} OR o.phone ILIKE $${vals.length} OR o.id::text = $${vals.length + 1})`
      );
      vals.push(String(q).replace('#', ''));
    }
    vals.push(limit, offset);
    const { rows } = await query(
      `SELECT o.*, u.username FROM orders o LEFT JOIN users u ON u.id = o.user_id
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY o.id DESC LIMIT $${vals.length - 1} OFFSET $${vals.length}`,
      vals
    );
    return withItems(rows);
  },

  async setStatus(id, status, adminNote) {
    if (!STATUSES.includes(status)) throw new Error('Noto‘g‘ri status');
    await query(
      `UPDATE orders SET status = $2, admin_note = COALESCE($3, admin_note), updated_at = now() WHERE id = $1`,
      [Number(id), status, adminNote ?? null]
    );
    return Order.get(id);
  },

  async stats() {
    const { rows } = await query(`
      SELECT
        count(*)::int AS total_orders,
        count(*) FILTER (WHERE status = 'new')::int AS new_orders,
        coalesce(sum(total) FILTER (WHERE status IN ('confirmed','shipped','delivered')), 0)::bigint AS revenue,
        coalesce(sum(total) FILTER (WHERE created_at > now() - interval '1 day' AND status <> 'cancelled'), 0)::bigint AS today_sales,
        count(*) FILTER (WHERE created_at > now() - interval '1 day')::int AS today_orders
      FROM orders`);
    const top = await query(`
      SELECT oi.product_id, oi.name, sum(oi.qty)::int AS qty, sum(oi.subtotal)::bigint AS sum
      FROM order_items oi JOIN orders o ON o.id = oi.order_id
      WHERE o.status <> 'cancelled'
      GROUP BY oi.product_id, oi.name ORDER BY qty DESC LIMIT 5`);
    // Kunlar Koreya vaqti bo'yicha
    const daily = await query(`
      WITH k AS (SELECT (now() AT TIME ZONE 'Asia/Seoul')::date AS today)
      SELECT to_char(d, 'MM-DD') AS day,
        coalesce((SELECT sum(total) FROM orders WHERE status <> 'cancelled'
                  AND (created_at AT TIME ZONE 'Asia/Seoul')::date = d::date), 0)::bigint AS sum,
        (SELECT count(*) FROM orders WHERE (created_at AT TIME ZONE 'Asia/Seoul')::date = d::date)::int AS orders
      FROM k, generate_series(k.today - 6, k.today, interval '1 day') d`);
    return { ...rows[0], top: top.rows, daily: daily.rows };
  },
};

export default Order;
