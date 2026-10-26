// Bot logikasi: /start, mahsulot kartochkasi, buyurtmalar, admin tugmalari, inline qidiruv
import { InputFile } from 'grammy';
import config from '../config/default.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order, { STATUS_LABELS, STATUSES } from '../models/Order.js';
import Image from '../models/Image.js';
import { formatKRW } from '../utils/pricing.js';
import { esc, refreshAdminMessage, notifyCustomer } from '../services/notify.js';
import { shopKeyboard, productKeyboard, canUseWebApp, appUrl } from '../utils/keyboards.js';
import { isAdminTelegramId } from '../middlewares/auth.middleware.js';
import logger from '../utils/logger.js';

const isAdmin = (ctx) => isAdminTelegramId(ctx.from?.id) || isAdminTelegramId(ctx.chat?.id);

/** Mahsulot haqida qisqa matn (ulashish va kartochka uchun) */
export function productShareCaption(p) {
  const prices = [
    p.priceRetail != null ? `🛍 Dona: <b>${formatKRW(p.priceRetail)}</b>` : null,
    p.priceWholesale != null
      ? `📦 Optom: <b>${formatKRW(p.priceWholesale)}</b>${p.wholesaleMin ? ` (${p.wholesaleMin} tadan)` : ''}`
      : null,
  ].filter(Boolean);
  return [
    `🌸 <b>${esc(p.name)}</b>`,
    p.brand ? `🏷 ${esc(p.brand)}${p.categoryName ? ` · ${esc(p.categoryName)}` : ''}` : null,
    p.description ? `\n${esc(p.description)}` : null,
    '',
    ...(prices.length ? prices : ['💬 Narx: kelishiladi']),
    '',
    `🇰🇷 MIRA Cosmetics — Koreyadan original mahsulotlar`,
  ]
    .filter((l) => l !== null)
    .join('\n');
}

async function sendProductCard(ctx, productId) {
  const p = await Product.get(productId);
  if (!p) return ctx.reply('Bu mahsulot topilmadi yoki sotuvdan olingan.');
  const img = p.imageId ? await Image.get(p.imageId) : null;
  const opts = { caption: productShareCaption(p), parse_mode: 'HTML', reply_markup: productKeyboard(p.id) };
  if (img) return ctx.replyWithPhoto(new InputFile(img.data, `product-${p.id}.jpg`), opts);
  return ctx.reply(opts.caption, { parse_mode: 'HTML', reply_markup: opts.reply_markup });
}

export async function onStart(ctx) {
  await User.upsert(ctx.from).catch(() => {});
  const payload = (ctx.match || '').trim();

  // t.me/<bot>?start=p_12 — mahsulot havolasi
  const pm = /^p_?(\d+)$/.exec(payload);
  if (pm) return sendProductCard(ctx, Number(pm[1]));

  const name = esc(ctx.from?.first_name || 'mehmon');
  const text = [
    `Assalomu alaykum, <b>${name}</b>! 🌸`,
    '',
    '<b>MIRA Cosmetics</b> — Koreyadan original kosmetika, vitamin va kollagenlar.',
    '🛍 Dona va 📦 optom narxlarda xarid qiling.',
    '',
    canUseWebApp()
      ? "Pastdagi tugma orqali do'konni oching 👇"
      : `Do'kon manzili: ${appUrl()}`,
  ].join('\n');

  const keyboard = shopKeyboard();
  if (canUseWebApp()) {
    return ctx.replyWithPhoto(appUrl('/images/og-cover.jpg'), { caption: text, parse_mode: 'HTML', reply_markup: keyboard }).catch(
      () => ctx.reply(text, { parse_mode: 'HTML', reply_markup: keyboard })
    );
  }
  return ctx.reply(text, { parse_mode: 'HTML' });
}

export async function onMyOrders(ctx) {
  const orders = await Order.listByUser(ctx.from.id, 5);
  if (!orders.length) return ctx.reply("Sizda hali buyurtmalar yo'q. Do'konga o'ting 👇", { reply_markup: shopKeyboard() });
  const text = orders
    .map((o) => `<b>#${o.id}</b> · ${formatKRW(o.total)} · ${STATUS_LABELS[o.status]}`)
    .join('\n');
  return ctx.reply(`📋 <b>Oxirgi buyurtmalaringiz</b>\n\n${text}`, {
    parse_mode: 'HTML',
    reply_markup: shopKeyboard('/profile', '📋 Barchasini ko‘rish'),
  });
}

/** /id — chat ID ni bilish (ADMIN_CHAT_IDS ga yozish uchun) */
export function onId(ctx) {
  logger.info(`/id: chat=${ctx.chat.id} user=${ctx.from?.id} (@${ctx.from?.username || '-'})`);
  return ctx.reply(
    `🆔 Chat ID: <code>${ctx.chat.id}</code>\n👤 Sizning ID: <code>${ctx.from?.id}</code>\n\nBuyurtmalarni shu yerga olish uchun bu raqamni <code>ADMIN_CHAT_IDS</code> ga yozing.`,
    { parse_mode: 'HTML' }
  );
}

export async function onAdmin(ctx) {
  if (!isAdmin(ctx)) return ctx.reply('Bu buyruq faqat adminlar uchun.');
  const s = await Order.stats();
  const text = [
    '👑 <b>Admin panel</b>',
    '',
    `🆕 Yangi buyurtmalar: <b>${s.new_orders}</b>`,
    `📅 Bugun: <b>${s.today_orders}</b> ta · ${formatKRW(Number(s.today_sales))}`,
    `💵 Tasdiqlangan savdo: <b>${formatKRW(Number(s.revenue))}</b>`,
    `👥 Foydalanuvchilar: <b>${await User.count()}</b>`,
  ].join('\n');
  return ctx.reply(text, {
    parse_mode: 'HTML',
    reply_markup: canUseWebApp() ? shopKeyboard('/admin', '🖥 Admin panelni ochish') : undefined,
  });
}

/** Admin xabaridagi status tugmalari: ord:<id>:<status> */
export async function onOrderAction(ctx) {
  const [, id, status] = ctx.match;
  if (!isAdmin(ctx)) return ctx.answerCallbackQuery({ text: "Ruxsat yo'q", show_alert: true });
  if (!STATUSES.includes(status)) return ctx.answerCallbackQuery();

  const before = await Order.get(id);
  if (!before) return ctx.answerCallbackQuery({ text: 'Buyurtma topilmadi', show_alert: true });

  const order = before.status === status ? before : await Order.setStatus(id, status);
  await ctx.answerCallbackQuery({ text: `#${order.id}: ${STATUS_LABELS[order.status]}` });
  await refreshAdminMessage(ctx, order);
  if (before.status !== status) await notifyCustomer(order);
}

/** Inline rejim: @bot <so'z> — mahsulotni rasm bilan ulashish */
export async function onInlineQuery(ctx) {
  const q = ctx.inlineQuery.query.trim();
  const products = q.length >= 2 ? await Product.search(q, 20) : (await Product.list()).filter((p) => p.isHit).slice(0, 20);
  const results = products.map((p) => {
    const link = appUrl(`/product/${p.id}`);
    const markup = canUseWebApp()
      ? { inline_keyboard: [[{ text: "🛍 Ko'rish va buyurtma berish", url: link }]] }
      : undefined;
    if (p.image && canUseWebApp()) {
      return {
        type: 'photo',
        id: `p${p.id}`,
        photo_url: appUrl(p.image),
        thumbnail_url: appUrl(p.image),
        title: p.name,
        description: formatKRW(p.priceRetail ?? p.priceWholesale),
        caption: productShareCaption(p),
        parse_mode: 'HTML',
        reply_markup: markup,
      };
    }
    return {
      type: 'article',
      id: `p${p.id}`,
      title: p.name,
      description: `${p.brand || ''} · ${formatKRW(p.priceRetail ?? p.priceWholesale)}`,
      input_message_content: { message_text: productShareCaption(p), parse_mode: 'HTML' },
      reply_markup: markup,
    };
  });
  return ctx.answerInlineQuery(results, { cache_time: 30, is_personal: false });
}

/** Bot sozlamalari: buyruqlar va menyu tugmasi */
export async function configureBot(bot) {
  await bot.api.setMyCommands([
    { command: 'start', description: "Do'konni ochish" },
    { command: 'orders', description: 'Mening buyurtmalarim' },
    { command: 'id', description: 'Chat ID ni bilish' },
  ]);
  if (canUseWebApp()) {
    await bot.api.setChatMenuButton({
      menu_button: { type: 'web_app', text: "🛍 Do'kon", web_app: { url: config.webappUrl } },
    });
  }
}
