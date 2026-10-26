// Savat: narxlarni serverda qayta hisoblash (mijoz yuborgan narxga ishonilmaydi)
import Product from '../models/Product.js';
import { unitPrice, minQty } from '../utils/pricing.js';

export const MAX_QTY = 9999;

/**
 * @param {{productId:number, qty:number}[]} rawItems
 * @param {'retail'|'wholesale'} mode
 * @returns {{ items: object[], total: number, problems: string[] }}
 */
export async function buildCart(rawItems, mode) {
  const wanted = new Map();
  for (const it of Array.isArray(rawItems) ? rawItems : []) {
    const id = Number(it?.productId);
    const qty = Math.floor(Number(it?.qty));
    if (!Number.isInteger(id) || !(qty > 0)) continue;
    wanted.set(id, Math.min((wanted.get(id) || 0) + qty, MAX_QTY));
  }

  const rows = await Product.getMany([...wanted.keys()]);
  const items = [];
  const problems = [];

  for (const [id, qty] of wanted) {
    const p = rows.find((r) => r.id === id);
    if (!p) {
      problems.push(`#${id} mahsulot topilmadi yoki sotuvda emas`);
      continue;
    }
    if (!p.in_stock) {
      problems.push(`"${p.name}" hozircha mavjud emas`);
      continue;
    }
    const price = unitPrice(p, mode);
    if (price == null) {
      problems.push(`"${p.name}" narxi kelishiladi — admin bilan bog'laning`);
      continue;
    }
    const min = minQty(p, mode);
    if (qty < min) {
      problems.push(`"${p.name}" optomda kamida ${min} dona`);
      continue;
    }
    items.push({
      productId: p.id,
      name: p.name,
      brand: p.brand,
      imageId: p.image_id,
      price,
      qty,
      subtotal: price * qty,
    });
  }

  return { items, total: items.reduce((s, i) => s + i.subtotal, 0), problems };
}

/** POST /api/cart/quote — savatni tekshirish */
export async function quote(req, res) {
  const mode = req.body?.priceMode === 'wholesale' ? 'wholesale' : 'retail';
  const { items, total, problems } = await buildCart(req.body?.items, mode);
  res.json({ priceMode: mode, items, total, problems });
}
