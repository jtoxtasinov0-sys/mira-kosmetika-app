// Sozlamalar va o'zgaruvchilar — barcha .env qiymatlari shu yerda yig'iladi
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const list = (v) =>
  (v || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const config = {
  env: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production' || !!process.env.VERCEL,
  isVercel: !!process.env.VERCEL,
  port: Number(process.env.PORT) || 4000,

  databaseUrl: process.env.DATABASE_URL,

  bot: {
    token: process.env.BOT_TOKEN || '',
    adminChatIds: list(process.env.ADMIN_CHAT_IDS),
    webhookSecret: process.env.WEBHOOK_SECRET || '',
    // Vercel'da doim webhook; Render va boshqa serverlarda BOT_MODE=webhook bilan yoqiladi, aks holda long polling
    webhookMode: !!process.env.VERCEL || process.env.BOT_MODE === 'webhook',
  },

  webappUrl: (process.env.WEBAPP_URL || 'http://localhost:3000').trim().replace(/\/$/, ''),

  admin: {
    password: process.env.ADMIN_PASSWORD || '',
    jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  },

  // Do'kon haqida standart ma'lumotlar (admin paneldan o'zgartiriladi — settings jadvali)
  defaults: {
    shop_name: 'MIRA Cosmetics',
    currency: 'KRW',
    // TEST karta (Stripe'ning ochiq test raqami) — haqiqiy to'lov qabul qilmaydi
    card_number: '4242 4242 4242 4242',
    card_holder: 'MIRA COSMETICS (TEST)',
    card_bank: 'Test Bank',
    contact_phone: '+82 10 0000 0000',
    contact_username: 'mira_cosmetics_admin',
    delivery_note: "Koreya bo'ylab pochta orqali yetkazib beramiz (2–3 kun). Optom buyurtmalar uchun narx kelishiladi.",
    announcement: "Koreyadan original kosmetika — optom va dona narxlarda",
  },
};

export default config;
