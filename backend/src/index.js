// Asosiy ishga tushirish fayli (lokal): API server + bot (long polling)
import config from './config/default.js';
import app from './app.js';
import bot from './core/bot.js';
import { configureBot } from './controllers/startController.js';
import logger from './utils/logger.js';

app.listen(config.port, () => {
  logger.info(`API: http://localhost:${config.port}/api/health`);
});

if (bot && !config.isVercel) {
  // Lokal rejimda webhook o'chiriladi va polling ishlatiladi.
  // DIQQAT: production (Vercel) webhook o'rnatilgan bo'lsa, lokal ishga tushirish uni o'chiradi —
  // keyin admin paneldagi "Botni ulash" tugmasini qayta bosing.
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
