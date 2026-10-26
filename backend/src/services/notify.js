// Telegram xabarnomalari: yangi buyurtma adminga (mahsulot rasmi + ma'lumotlari), status — mijozga
import { InputFile } from 'grammy';
import bot from '../core/bot.js';
import config from '../config/default.js';
import Image from '../models/Image.js';
import { STATUS_LABELS } from '../models/Order.js';
import { formatKRW, modeLabel } from '../utils/pricing.js';
import { orderAdminKeyboard, customerOrderKeyboard } from '../utils/keyboards.js';
import logger from '../utils/logger.js';

const CAPTION_LIMIT = 1024;
const LINE = '━━━━━━━━━━━━━━';

export const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const fmtDate = (d) =>
  new Date(d).toLocaleString('ru-RU', { timeZone: 'Asia/Seoul', dateStyle: 'short', timeStyle: 'short' });

async function photoInput(imageId, fallbackName = 'image.jpg') {
  const img = imageId ? await Image.get(imageId) : null;
  return img ? new InputFile(img.data, fallbackName) : null;
}

/** Bitta mahsulot uchun izoh (rasm tagida) */
export function itemCaption(order, item, index) {
  return [
    `🛍 <b>Buyurtma #${order.id}</b> · ${index + 1}/${order.items.length}`,
    '',
    `<b>${esc(item.name)}</b>`,
    item.brand ? `🏷 ${esc(item.brand)}` : null,
    `💰 ${formatKRW(item.price)} × ${item.qty} = <b>${formatKRW(item.subtotal)}</b>`,
    `📦 Narx turi: ${modeLabel(order.priceMode)}`,
  ]
    .filter((l) => l !== null)
    .join('\n');
}

/** Buyurtma bo'yicha umumiy ma'lumot (chek rasmi tagida + tugmalar) */
export function orderSummary(order) {
  const user = order.userId
    ? order.username
      ? `🔗 @${esc(order.username)}`
      : `🔗 <a href="tg://user?id=${order.userId}">Telegram profili</a>`
    : '🌐 Brauzer orqali (Telegram’siz)';
  const lines = [
    `🧾 <b>Buyurtma #${order.id}</b> — ${STATUS_LABELS[order.status] || order.status}`,
    LINE,
    `👤 ${esc(order.customerName)}`,
    `📞 ${esc(order.phone)}`,
    order.address ? `📍 ${esc(order.address)}` : null,
    order.comment ? `💬 ${esc(order.comment)}` : null,
    user,
    LINE,
    ...order.items.map(
      (i, n) => `${n + 1}. ${esc(i.name)} — ${i.qty} × ${formatKRW(i.price)} = ${formatKRW(i.subtotal)}`
    ),
    LINE,
    `📦 Narx turi: <b>${modeLabel(order.priceMode)}</b> · ${order.itemsCount} dona`,
    `💵 Jami: <b>${formatKRW(order.total)}</b>`,
    `💳 To'lov: kartaga o'tkazma${order.paymentCard ? ` (${esc(order.paymentCard)})` : ''}`,
    order.receipt ? '🧾 Chek: ilova qilingan (rasmda)' : '⚠️ Chek yuklanmagan',
    order.adminNote ? `📝 ${esc(order.adminNote)}` : null,
    `🕒 ${fmtDate(order.createdAt)}`,
  ];
  return lines.filter((l) => l !== null).join('\n');
}

const fitCaption = (text) => (text.length <= CAPTION_LIMIT ? text : `${text.slice(0, CAPTION_LIMIT - 2)}…`);

/** Yangi buyurtmani barcha adminlarga yuborish */
export async function sendOrderToAdmins(order) {
  if (!bot || !config.bot.adminChatIds.length) {
    logger.warn(`Buyurtma #${order.id}: BOT_TOKEN yoki ADMIN_CHAT_IDS yo'q — Telegram xabari yuborilmadi`);
    return;
  }
  const summary = orderSummary(order);
  const keyboard = orderAdminKeyboard(order);

  for (const chatId of config.bot.adminChatIds) {
    try {
      // 1) Har bir mahsulot: rasm + tagida ma'lumot
      for (const [idx, item] of order.items.entries()) {
        const caption = itemCaption(order, item, idx);
        const photo = await photoInput(item.imageId, `product-${item.productId}.jpg`);
        if (photo) await bot.api.sendPhoto(chatId, photo, { caption, parse_mode: 'HTML' });
        else await bot.api.sendMessage(chatId, caption, { parse_mode: 'HTML' });
      }
      // 2) Chek rasmi + umumiy ma'lumot + boshqaruv tugmalari
      const receipt = await photoInput(order.receiptImageId, `chek-${order.id}.jpg`);
      if (receipt && summary.length <= CAPTION_LIMIT) {
        await bot.api.sendPhoto(chatId, receipt, { caption: summary, parse_mode: 'HTML', reply_markup: keyboard });
      } else {
        if (receipt) await bot.api.sendPhoto(chatId, receipt, { caption: `🧾 Buyurtma #${order.id} — to'lov cheki` });
        await bot.api.sendMessage(chatId, summary, {
          parse_mode: 'HTML',
          reply_markup: keyboard,
          link_preview_options: { is_disabled: true },
        });
      }
    } catch (err) {
      logger.error(`Adminga yuborishda xato (chat ${chatId}):`, err.description || err.message);
    }
  }
}

/** Admin tugmani bosganda xabarni yangilash (rasm izohi yoki matn) */
export async function refreshAdminMessage(ctx, order) {
  const summary = orderSummary(order);
  const opts = { parse_mode: 'HTML', reply_markup: orderAdminKeyboard(order) };
  try {
    if (ctx.callbackQuery?.message?.photo) await ctx.editMessageCaption({ caption: fitCaption(summary), ...opts });
    else await ctx.editMessageText(summary, { ...opts, link_preview_options: { is_disabled: true } });
  } catch (err) {
    if (!String(err.description || '').includes('not modified')) logger.warn('Xabarni yangilab bo‘lmadi:', err.message);
  }
}

const CUSTOMER_TEXT = {
  new: (o) =>
    `✅ <b>Buyurtmangiz qabul qilindi!</b>\n\nBuyurtma raqami: <b>#${o.id}</b>\nJami: <b>${formatKRW(o.total)}</b>\n\nTo'lov chekini tekshirib, tez orada tasdiqlaymiz. Rahmat! 💜`,
  confirmed: (o) => `💜 Buyurtma <b>#${o.id}</b>: to'lov tasdiqlandi. Buyurtmangiz tayyorlanmoqda.`,
  shipped: (o) => `🚚 Buyurtma <b>#${o.id}</b> jo'natildi! Tez orada qo'lingizda bo'ladi.`,
  delivered: (o) => `📦 Buyurtma <b>#${o.id}</b> yetkazildi. Xaridingiz uchun rahmat! 🌸`,
  cancelled: (o) =>
    `❌ Buyurtma <b>#${o.id}</b> bekor qilindi.${o.adminNote ? `\nIzoh: ${esc(o.adminNote)}` : ''}\nSavollar bo'lsa, bizga yozing.`,
};

export async function notifyCustomer(order) {
  if (!bot || !order.userId || !CUSTOMER_TEXT[order.status]) return;
  try {
    await bot.api.sendMessage(order.userId, CUSTOMER_TEXT[order.status](order), {
      parse_mode: 'HTML',
      reply_markup: customerOrderKeyboard(order),
    });
  } catch (err) {
    // Foydalanuvchi botni ishga tushirmagan bo'lishi mumkin — bu normal holat
    logger.warn(`Mijozga xabar yuborilmadi (${order.userId}):`, err.description || err.message);
  }
}
