// Tugmalar shablonlari
import { InlineKeyboard } from 'grammy';
import config from '../config/default.js';

// Telegram web_app / url tugmalari faqat https manzil bilan ishlaydi
export const canUseWebApp = () => config.webappUrl.startsWith('https://');

export const appUrl = (path = '') => `${config.webappUrl}${path}`;

export function shopKeyboard(path = '', text = "🛍 Do'konni ochish") {
  if (!canUseWebApp()) return undefined;
  return new InlineKeyboard().webApp(text, appUrl(path));
}

export function productKeyboard(productId) {
  if (!canUseWebApp()) return undefined;
  return new InlineKeyboard()
    .webApp("🛍 Ko'rish va buyurtma berish", appUrl(`/product/${productId}`))
    .row()
    .url('🔗 Havola', appUrl(`/product/${productId}`));
}

/** Admin uchun buyurtma statusini boshqarish tugmalari */
export function orderAdminKeyboard(order) {
  const kb = new InlineKeyboard();
  const s = order.status;
  if (s === 'new') kb.text('✅ Tasdiqlash', `ord:${order.id}:confirmed`).text('❌ Bekor qilish', `ord:${order.id}:cancelled`).row();
  if (s === 'confirmed') kb.text("🚚 Jo'natildi", `ord:${order.id}:shipped`).text('❌ Bekor qilish', `ord:${order.id}:cancelled`).row();
  if (s === 'shipped') kb.text('📦 Yetkazildi', `ord:${order.id}:delivered`).row();
  if (s === 'cancelled') kb.text('↩️ Qayta ochish', `ord:${order.id}:new`).row();
  if (canUseWebApp()) kb.url('🖥 Admin panelda ochish', appUrl(`/admin/orders/${order.id}`));
  return kb;
}

export function customerOrderKeyboard(order) {
  if (!canUseWebApp()) return undefined;
  return new InlineKeyboard().webApp('📋 Buyurtmani ko‘rish', appUrl(`/orders/${order.publicId}`));
}
