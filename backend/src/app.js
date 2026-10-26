// Express ilovasi (lokal server va Vercel funksiyasi uchun umumiy)
import express from 'express';
import cors from 'cors';
import { webhookCallback } from 'grammy';
import config from './config/default.js';
import bot from './core/bot.js';
import apiRoutes from './routes/api.routes.js';
import { registerBotRoutes } from './routes/bot.routes.js';
import logger from './utils/logger.js';

registerBotRoutes(bot);

const app = express();
app.set('trust proxy', true);
app.disable('x-powered-by');

app.use(
  cors({
    origin: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Telegram-Init-Data'],
  })
);

// Telegram webhook (production: Render / Vercel). Lokal rejimda bot long polling bilan ishlaydi (src/index.js)
if (bot && config.bot.webhookMode) {
  app.post(
    '/api/bot/webhook',
    express.json(),
    webhookCallback(bot, 'express', {
      secretToken: config.bot.webhookSecret || undefined,
      onTimeout: 'return',
      timeoutMilliseconds: 9_000,
    })
  );
}

// Chek va mahsulot rasmlari base64 ko'rinishida keladi
app.use(express.json({ limit: '6mb' }));

app.get('/', (_req, res) => res.json({ name: 'MIRA Cosmetics API', ok: true }));
app.use('/api', apiRoutes);

app.use((_req, res) => res.status(404).json({ error: 'Topilmadi' }));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Fayl juda katta' });
  logger.error(err.stack || err.message);
  res.status(500).json({ error: 'Serverda xatolik. Qaytadan urinib ko‘ring.' });
});

export default app;
