// Foydalanuvchini tekshirish: Telegram initData (Mini App) yoki admin JWT (admin panel)
import jwt from 'jsonwebtoken';
import config from '../config/default.js';
import User from '../models/User.js';
import { validateInitData } from '../utils/telegramAuth.js';
import logger from '../utils/logger.js';

/**
 * Mini App so'rovlari "X-Telegram-Init-Data" sarlavhasini yuboradi.
 * Imzo to'g'ri bo'lsa req.tgUser to'ldiriladi va foydalanuvchi bazaga yoziladi.
 * Brauzerdan (Telegram'siz) kirilganda req.tgUser = null — mehmon sifatida ishlaydi.
 */
export async function telegramUser(req, _res, next) {
  req.tgUser = null;
  const initData = req.get('x-telegram-init-data');
  if (initData) {
    const parsed = validateInitData(initData, config.bot.token);
    if (parsed) {
      req.tgUser = parsed.user;
      try {
        await User.upsert(parsed.user);
      } catch (err) {
        logger.warn('User upsert:', err.message);
      }
    }
  }
  next();
}

export function requireTelegramUser(req, res, next) {
  if (!req.tgUser) return res.status(401).json({ error: 'Telegram orqali kiring' });
  next();
}

export const signAdminToken = (sub) =>
  jwt.sign({ sub: String(sub), role: 'admin' }, config.admin.jwtSecret, { expiresIn: '7d' });

export function requireAdmin(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Admin token kerak' });
  try {
    const payload = jwt.verify(token, config.admin.jwtSecret);
    if (payload.role !== 'admin') throw new Error('role');
    req.admin = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Sessiya tugagan, qayta kiring' });
  }
}

export const isAdminTelegramId = (id) => config.bot.adminChatIds.includes(String(id));
