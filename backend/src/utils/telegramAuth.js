// Telegram Mini App initData imzosini tekshirish
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
import crypto from 'node:crypto';

const MAX_AGE_SEC = 7 * 24 * 3600;

export function validateInitData(initData, botToken) {
  if (!initData || !botToken) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const calc = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');

  const a = Buffer.from(calc, 'hex');
  const b = Buffer.from(hash, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  const authDate = Number(params.get('auth_date') || 0);
  if (!authDate || Date.now() / 1000 - authDate > MAX_AGE_SEC) return null;

  try {
    const user = JSON.parse(params.get('user') || 'null');
    return user?.id ? { user, startParam: params.get('start_param') } : null;
  } catch {
    return null;
  }
}
