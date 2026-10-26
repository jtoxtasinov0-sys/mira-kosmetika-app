// Hamma bot handlerlarini bitta joyga yig'ish
import {
  onStart,
  onMyOrders,
  onId,
  onAdmin,
  onOrderAction,
  onInlineQuery,
} from '../controllers/startController.js';

export function registerBotRoutes(bot) {
  if (!bot) return;
  bot.command('start', onStart);
  bot.command('shop', onStart);
  bot.command('orders', onMyOrders);
  bot.command('id', onId);
  bot.command('admin', onAdmin);
  bot.callbackQuery(/^ord:(\d+):(\w+)$/, onOrderAction);
  bot.on('inline_query', onInlineQuery);
  bot.on('message:text', (ctx) =>
    ctx.reply("Do'konni ochish uchun /start bosing 🌸")
  );
}
