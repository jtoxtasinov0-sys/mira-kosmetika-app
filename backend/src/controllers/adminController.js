// Admin panel API
import crypto from 'node:crypto';
import config from '../config/default.js';
import bot from '../core/bot.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Order, { STATUSES } from '../models/Order.js';
import Setting from '../models/Setting.js';
import User from '../models/User.js';
import Image, { parseDataUrl } from '../models/Image.js';
import { signAdminToken, isAdminTelegramId } from '../middlewares/auth.middleware.js';
import { notifyCustomer } from '../services/notify.js';
import { configureBot } from './startController.js';

const safeEqual = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

// ---------- Kirish ----------
export function login(req, res) {
  const { password } = req.body || {};
  if (!config.admin.password) return res.status(500).json({ error: 'ADMIN_PASSWORD sozlanmagan' });
  if (!password || !safeEqual(password, config.admin.password)) {
    return res.status(401).json({ error: "Parol noto'g'ri" });
  }
  res.json({ token: signAdminToken('password') });
}

/** Telegram ichidan: ADMIN_CHAT_IDS dagi foydalanuvchi parolsiz kiradi */
export function telegramLogin(req, res) {
  if (!req.tgUser || !isAdminTelegramId(req.tgUser.id)) return res.status(403).json({ error: 'Admin emassiz' });
  res.json({ token: signAdminToken(`tg:${req.tgUser.id}`) });
}

// ---------- Statistika ----------
export async function stats(_req, res) {
  const [s, users, products] = await Promise.all([Order.stats(), User.count(), Product.list({ includeInactive: true })]);
  res.json({
    ...s,
    revenue: Number(s.revenue),
    today_sales: Number(s.today_sales),
    users,
    products: products.length,
    activeProducts: products.filter((p) => p.isActive).length,
    daily: s.daily.map((d) => ({ ...d, sum: Number(d.sum) })),
    top: s.top.map((t) => ({ ...t, sum: Number(t.sum) })),
  });
}

// ---------- Buyurtmalar ----------
export async function listOrders(req, res) {
  const orders = await Order.list({
    status: req.query.status,
    q: String(req.query.q || '').trim() || undefined,
    limit: Math.min(Number(req.query.limit) || 50, 200),
    offset: Number(req.query.offset) || 0,
  });
  res.json({ orders });
}

export async function getOrder(req, res) {
  const order = await Order.get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Topilmadi' });
  res.json({ order });
}

export async function updateOrder(req, res) {
  const { status, adminNote } = req.body || {};
  const before = await Order.get(req.params.id);
  if (!before) return res.status(404).json({ error: 'Topilmadi' });
  if (!STATUSES.includes(status)) return res.status(400).json({ error: "Status noto'g'ri" });
  const order = await Order.setStatus(req.params.id, status, adminNote ? String(adminNote).slice(0, 500) : undefined);
  if (before.status !== status) await notifyCustomer(order);
  res.json({ order });
}

// ---------- Mahsulotlar ----------
const intOrNull = (v) => {
  if (v === '' || v === null || v === undefined) return null;
  const n = Math.round(Number(String(v).replace(/[\s,]/g, '')));
  return Number.isFinite(n) && n >= 0 ? n : null;
};
const textOrNull = (v, max = 500) => {
  const s = String(v ?? '').trim();
  return s ? s.slice(0, max) : null;
};

function productInput(body, partial) {
  const out = {};
  const has = (k) => Object.prototype.hasOwnProperty.call(body, k);
  if (!partial || has('name')) out.name = String(body.name || '').trim().slice(0, 200);
  for (const k of ['brand', 'wholesaleNote', 'boxNote']) if (!partial || has(k)) out[k] = textOrNull(body[k], 200);
  if (!partial || has('description')) out.description = textOrNull(body.description, 2000);
  for (const k of ['priceRetail', 'priceWholesale', 'wholesaleMin', 'priceBox', 'categoryId'])
    if (!partial || has(k)) out[k] = intOrNull(body[k]);
  if (has('sort')) out.sort = intOrNull(body.sort) ?? 0;
  if (has('imageId')) out.imageId = body.imageId || null;
  for (const k of ['isHit', 'isNew', 'inStock', 'isActive']) if (has(k)) out[k] = !!body[k];
  return out;
}

export async function listProducts(_req, res) {
  res.json({ products: await Product.list({ includeInactive: true }) });
}

export async function createProduct(req, res) {
  const data = productInput(req.body || {}, false);
  if (!data.name) return res.status(400).json({ error: 'Nomi kerak' });
  res.status(201).json({ product: await Product.create(data) });
}

export async function updateProduct(req, res) {
  const data = productInput(req.body || {}, true);
  if (data.name === '') return res.status(400).json({ error: 'Nomi kerak' });
  const before = await Product.get(req.params.id, { includeInactive: true });
  if (!before) return res.status(404).json({ error: 'Topilmadi' });
  // Eski rasm o'chirilmaydi: avvalgi buyurtmalar (order_items.image_id) unga havola qiladi
  const product = await Product.update(req.params.id, data);
  res.json({ product });
}

export async function deleteProduct(req, res) {
  const removed = await Product.remove(req.params.id);
  if (!removed) return res.status(404).json({ error: 'Topilmadi' });
  res.json({ ok: true });
}

// ---------- Rasm yuklash ----------
export async function uploadImage(req, res) {
  const parsed = parseDataUrl(req.body?.dataUrl);
  if (!parsed) return res.status(400).json({ error: 'Rasm formati noto‘g‘ri yoki hajmi katta (max 3MB)' });
  const kind = ['product', 'category', 'banner'].includes(req.body?.kind) ? req.body.kind : 'product';
  const id = await Image.create({
    kind,
    ...parsed,
    width: intOrNull(req.body?.width),
    height: intOrNull(req.body?.height),
  });
  res.status(201).json({ id, url: `/api/images/${id}` });
}

// ---------- Kategoriyalar ----------
export async function listCategories(_req, res) {
  res.json({ categories: await Category.list() });
}

export async function createCategory(req, res) {
  const name = String(req.body?.name || '').trim().slice(0, 60);
  if (!name) return res.status(400).json({ error: 'Nomi kerak' });
  res.status(201).json({
    category: await Category.create({
      name,
      emoji: textOrNull(req.body?.emoji, 8),
      imageId: req.body?.imageId || null,
      sort: intOrNull(req.body?.sort) ?? 0,
    }),
  });
}

export async function updateCategory(req, res) {
  const b = req.body || {};
  const category = await Category.update(req.params.id, {
    name: b.name ? String(b.name).trim().slice(0, 60) : undefined,
    emoji: b.emoji !== undefined ? textOrNull(b.emoji, 8) ?? '' : undefined,
    imageId: b.imageId !== undefined ? b.imageId || null : undefined,
    sort: b.sort !== undefined ? intOrNull(b.sort) ?? 0 : undefined,
  });
  if (!category) return res.status(404).json({ error: 'Topilmadi' });
  res.json({ category });
}

export async function deleteCategory(req, res) {
  await Category.remove(req.params.id);
  res.json({ ok: true });
}

// ---------- Sozlamalar ----------
export async function getSettings(_req, res) {
  res.json({ settings: await Setting.all() });
}

export async function saveSettings(req, res) {
  res.json({ settings: await Setting.save(req.body || {}) });
}

// ---------- Bot ----------
const backendPublicUrl = (req) => {
  if (process.env.BACKEND_URL) return process.env.BACKEND_URL.replace(/\/$/, '');
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return `${req.protocol}://${req.get('host')}`;
};

export async function botStatus(_req, res) {
  if (!bot) return res.json({ enabled: false, adminChatIds: config.bot.adminChatIds });
  try {
    const [me, webhook] = await Promise.all([bot.api.getMe(), bot.api.getWebhookInfo()]);
    res.json({
      enabled: true,
      username: me.username,
      name: me.first_name,
      webhook: { url: webhook.url, pending: webhook.pending_update_count, lastError: webhook.last_error_message },
      adminChatIds: config.bot.adminChatIds,
      webappUrl: config.webappUrl,
    });
  } catch (err) {
    res.json({ enabled: false, error: err.description || err.message });
  }
}

/** Webhook + buyruqlar + menyu tugmasini o'rnatish (Vercel'ga joylagandan keyin bir marta bosiladi) */
export async function setupBot(req, res) {
  if (!bot) return res.status(400).json({ error: 'BOT_TOKEN sozlanmagan' });
  try {
    const url = `${backendPublicUrl(req)}/api/bot/webhook`;
    if (!url.startsWith('https://')) {
      return res.status(400).json({ error: `Webhook uchun https manzil kerak (hozir: ${url}). Lokal rejimda bot polling bilan ishlaydi.` });
    }
    await bot.api.setWebhook(url, {
      secret_token: config.bot.webhookSecret || undefined,
      allowed_updates: ['message', 'callback_query', 'inline_query'],
      drop_pending_updates: false,
    });
    await configureBot(bot);
    res.json({ ok: true, webhook: url });
  } catch (err) {
    res.status(502).json({ error: err.description || err.message });
  }
}
