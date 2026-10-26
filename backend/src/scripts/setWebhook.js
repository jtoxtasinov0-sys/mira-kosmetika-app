// Webhookni qo'lda o'rnatish: npm run webhook:set -- https://<backend-domeni>
import config from '../config/default.js';
import bot from '../core/bot.js';
import { configureBot } from '../controllers/startController.js';

const base = (process.argv[2] || process.env.BACKEND_URL || '').replace(/\/$/, '');
if (!bot) throw new Error('BOT_TOKEN yo‘q');
if (!base.startsWith('https://')) throw new Error('Foydalanish: npm run webhook:set -- https://backend-domeni.vercel.app');

await bot.api.setWebhook(`${base}/api/bot/webhook`, {
  secret_token: config.bot.webhookSecret || undefined,
  allowed_updates: ['message', 'callback_query', 'inline_query'],
});
await configureBot(bot);
console.log('Webhook o‘rnatildi:', await bot.api.getWebhookInfo());
process.exit(0);
