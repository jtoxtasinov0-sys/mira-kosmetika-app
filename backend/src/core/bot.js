// Bot instansiyasini yaratish
import { Bot } from 'grammy';
import config from '../config/default.js';
import logger from '../utils/logger.js';

let bot = null;

if (config.bot.token) {
  bot = new Bot(config.bot.token);
  bot.catch((err) => logger.error('Bot xatosi:', err.error?.message || err.message));
} else {
  logger.warn('BOT_TOKEN berilmagan — bot va Telegram xabarnomalari o‘chirilgan');
}

export default bot;
