// Katalog, mahsulot, rasmlar va ulashish
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Setting from '../models/Setting.js';
import Image from '../models/Image.js';
import bot from '../core/bot.js';
import { canUseWebApp, appUrl } from '../utils/keyboards.js';
import { productShareCaption } from './startController.js';

/** GET /api/catalog — bosh sahifa uchun hammasi bitta so'rovda */
export async function catalog(_req, res) {
  const [categories, products, settings] = await Promise.all([
    Category.list(),
    Product.list(),
    Setting.all(),
  ]);
  res.set('Cache-Control', 'public, max-age=15, s-maxage=30, stale-while-revalidate=300');
  res.json({ categories, products, settings });
}

/** GET /api/products/:id */
export async function getProduct(req, res) {
  const product = await Product.get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Mahsulot topilmadi' });
  res.set('Cache-Control', 'public, max-age=15, s-maxage=30, stale-while-revalidate=300');
  res.json({ product });
}

/** GET /api/search?q= */
export async function search(req, res) {
  const q = String(req.query.q || '').trim().slice(0, 60);
  if (q.length < 2) return res.json({ products: [] });
  res.json({ products: await Product.search(q) });
}

/** GET /api/images/:id — rasm id bo'yicha o'zgarmaydi, shuning uchun uzoq keshlanadi */
export async function getImage(req, res) {
  const img = await Image.get(req.params.id);
  if (!img) return res.status(404).end();
  res.set('Content-Type', img.mime);
  res.set('Cache-Control', img.kind === 'receipt' ? 'private, max-age=3600' : 'public, max-age=31536000, immutable');
  res.send(img.data);
}

/**
 * POST /api/share/:id — Telegram ichida "Ulashish": rasm + izoh + tugmali tayyor xabar
 * (Bot API 8.0 savePreparedInlineMessage → WebApp.shareMessage)
 */
export async function prepareShare(req, res) {
  if (!bot || !req.tgUser || !canUseWebApp()) return res.status(400).json({ error: 'unavailable' });
  const product = await Product.get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Mahsulot topilmadi' });

  const link = appUrl(`/product/${product.id}`);
  const result = product.image
    ? {
        type: 'photo',
        id: `p${product.id}-${Date.now()}`,
        photo_url: appUrl(product.image),
        thumbnail_url: appUrl(product.image),
        caption: productShareCaption(product),
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: [[{ text: "🛍 Ko'rish va buyurtma berish", url: link }]] },
      }
    : {
        type: 'article',
        id: `p${product.id}-${Date.now()}`,
        title: product.name,
        input_message_content: { message_text: productShareCaption(product), parse_mode: 'HTML' },
        reply_markup: { inline_keyboard: [[{ text: "🛍 Ko'rish va buyurtma berish", url: link }]] },
      };

  try {
    const prepared = await bot.api.savePreparedInlineMessage(req.tgUser.id, result, {
      allow_user_chats: true,
      allow_bot_chats: true,
      allow_group_chats: true,
      allow_channel_chats: true,
    });
    res.json({ id: prepared.id });
  } catch (err) {
    res.status(502).json({ error: err.description || err.message });
  }
}
