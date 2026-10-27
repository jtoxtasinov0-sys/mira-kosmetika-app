// Asosiy ishga tushirish fayli: API server + bot
// - lokal: long polling
// - Render (BOT_MODE=webhook): webhook avtomatik o'rnatiladi (RENDER_EXTERNAL_URL/api/bot/webhook)
import config from './config/default.js';
import app from './app.js';
import bot from './core/bot.js';
import { configureBot } from './controllers/startController.js';
import { removeMira48hFresh } from './database/cleanup.js';
import logger from './utils/logger.js';

app.listen(config.port, () => {
  logger.info(`API: http://localhost:${config.port}/api/health`);
});

removeMira48hFresh().catch((err) => logger.error('Tozalash bajarilmadi:', err.message));

const publicUrl = (process.env.RENDER_EXTERNAL_URL || process.env.BACKEND_URL || '').replace(/\/$/, '');

if (bot && config.bot.webhookMode) {
  (async () => {
    if (!publicUrl.startsWith('https://')) {
      logger.warn('Webhook rejimi: BACKEND_URL (https) topilmadi — admin paneldagi "Botni ulash" tugmasini bosing');
      return;
    }
    try {
      await bot.api.setWebhook(`${publicUrl}/api/bot/webhook`, {
        secret_token: config.bot.webhookSecret || undefined,
        allowed_updates: ['message', 'callback_query', 'inline_query'],
      });
      await configureBot(bot);
      logger.info(`Bot webhook: ${publicUrl}/api/bot/webhook`);
    } catch (err) {
      logger.error('Webhookni o‘rnatib bo‘lmadi:', err.description || err.message);
    }
  })();
} else if (bot) {
  // DIQQAT: production webhook o'rnatilgan bo'lsa, lokal ishga tushirish uni o'chiradi —
  // keyin admin paneldagi "Botni ulash" tugmasini bosing yoki Render servisini qayta ishga tushiring.
  (async () => {
    try {
      await bot.api.deleteWebhook();
      await configureBot(bot).catch((e) => logger.warn('configureBot:', e.message));
      bot.start({
        allowed_updates: ['message', 'callback_query', 'inline_query'],
        onStart: (me) => logger.info(`Bot ishga tushdi: @${me.username} (polling)`),
      });
    } catch (err) {
      logger.error('Botni ishga tushirib bo‘lmadi:', err.description || err.message);
    }
  })();
}

const shutdown = () => {
  if (bot?.isRunning()) bot.stop();
  process.exit(0);
};
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
