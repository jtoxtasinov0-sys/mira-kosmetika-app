// Buyurtma berish va mijoz buyurtmalari
import Order from '../models/Order.js';
import Image, { parseDataUrl } from '../models/Image.js';
import Setting from '../models/Setting.js';
import User from '../models/User.js';
import { buildCart } from './cartController.js';
import { sendOrderToAdmins, notifyCustomer } from '../services/notify.js';
import logger from '../utils/logger.js';

const clean = (s, max = 300) => String(s ?? '').trim().slice(0, max);

/** POST /api/orders */
export async function createOrder(req, res) {
  const body = req.body || {};
  const priceMode = body.priceMode === 'wholesale' ? 'wholesale' : 'retail';
  const customerName = clean(body.customerName, 80);
  const phone = clean(body.phone, 30);
  const address = clean(body.address, 300);
  const comment = clean(body.comment, 500);

  if (customerName.length < 2) return res.status(400).json({ error: 'Ismingizni kiriting' });
  if (!/^[+\d][\d\s()-]{6,}$/.test(phone)) return res.status(400).json({ error: "Telefon raqam noto'g'ri" });
  if (address.length < 5) return res.status(400).json({ error: 'Yetkazib berish manzilini kiriting' });

  const receipt = parseDataUrl(body.receipt);
  if (!receipt) return res.status(400).json({ error: "To'lov chekini (skrinshot) yuklang" });

  const { items, problems } = await buildCart(body.items, priceMode);
  if (problems.length) return res.status(409).json({ error: problems[0], problems });
  if (!items.length) return res.status(400).json({ error: "Savat bo'sh" });

  const settings = await Setting.all();
  const receiptImageId = await Image.create({ kind: 'receipt', ...receipt });

  const created = await Order.create(
    {
      userId: req.tgUser?.id,
      customerName,
      phone,
      address,
      comment,
      priceMode,
      receiptImageId,
      paymentCard: settings.card_number,
    },
    items
  );
  if (req.tgUser?.id) await User.setPhone(req.tgUser.id, phone).catch(() => {});

  const order = await Order.get(created.id);
  // Vercel'da javobdan oldin yuborib ulgurish uchun kutamiz
  try {
    await sendOrderToAdmins(order);
    await notifyCustomer(order);
  } catch (err) {
    logger.error('Xabarnoma xatosi:', err.message);
  }

  res.status(201).json({ order: publicOrder(order) });
}

/** Mijozga ko'rsatiladigan qism (ichki maydonlarsiz) */
export const publicOrder = (o) => ({
  id: o.id,
  publicId: o.publicId,
  customerName: o.customerName,
  phone: o.phone,
  address: o.address,
  comment: o.comment,
  priceMode: o.priceMode,
  itemsCount: o.itemsCount,
  total: o.total,
  status: o.status,
  adminNote: o.status === 'cancelled' ? o.adminNote : null,
  createdAt: o.createdAt,
  items: o.items,
});

/** GET /api/orders/:publicId */
export async function getOrder(req, res) {
  const order = await Order.getByPublicId(req.params.publicId);
  if (!order) return res.status(404).json({ error: 'Buyurtma topilmadi' });
  res.json({ order: publicOrder(order) });
}

/** GET /api/me/orders — Telegram foydalanuvchisining buyurtmalari */
export async function myOrders(req, res) {
  const orders = await Order.listByUser(req.tgUser.id);
  res.json({ orders: orders.map(publicOrder) });
}
