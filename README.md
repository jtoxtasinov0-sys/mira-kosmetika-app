# MIRA Cosmetics — Telegram Mini App

Koreyadan kosmetika sotadigan do‘kon uchun Telegram Mini App: **dona va optom** narxlar, karta orqali to‘lov (chek yuklanadi), admin panel va Telegram bot.

```
backend/   Express + grammY (bot) + PostgreSQL (Neon)   → Vercel loyiha #1
frontend/  Next.js 16 (App Router) + Tailwind + Zustand  → Vercel loyiha #2
```

## Imkoniyatlar

- **Dona / Optom** rejimi (🇰🇷 tugma): narxlar butun ilovada darhol o‘zgaradi, optomda minimal miqdor nazorat qilinadi.
- 9 kategoriya, 63 mahsulot rasmlari bilan (`backend/seed/`).
- **To‘lov faqat kartaga o‘tkazma**: mijoz karta raqamini ko‘radi, summani o‘tkazadi va chek skrinshotini yuklaydi.
  Test karta: `4242 4242 4242 4242` — admin panel → Sozlamalar’dan o‘zgartiriladi.
- **Yangi buyurtma adminga Telegram’da keladi**: har bir mahsulot — rasmi va tagida ma’lumotlari bilan, so‘ng chek rasmi + umumiy ma’lumot va
  “✅ Tasdiqlash / ❌ Bekor qilish / 🚚 Jo‘natildi” tugmalari. Status o‘zgarsa mijozga bot xabar yuboradi.
- **Havola ulashilganda rasm bilan chiqadi**: har bir mahsulot sahifasi (`/product/12`) o‘zining og:image rasmini (mahsulot rasmi + nomi + narxlari) beradi.
  Telegram ichidagi “Ulashish” tugmasi tayyor xabarni (rasm + narx + tugma) yuboradi.
- **Admin panel** (`/admin`): statistika, buyurtmalar (chekni ko‘rish, status), mahsulotlar (qo‘shish/tahrirlash/rasm yuklash), kategoriyalar, sozlamalar, botni ulash.

## Lokal ishga tushirish

```bash
cd backend && npm install && npm run seed && npm run dev     # http://localhost:4000
cd frontend && npm install && npm run dev                    # http://localhost:3000
```

`backend/.env` va `frontend/.env.local` — namunasi `.env.example` fayllarida. Admin parol: `backend/.env` → `ADMIN_PASSWORD`.

Bot lokal rejimda polling bilan ishlaydi. Buyurtmalar kelishi uchun botga `/id` yuboring va chiqqan raqamni `ADMIN_CHAT_IDS` ga yozing.

## Vercel’ga joylash (bitta GitHub repodan ikki loyiha)

1. **Backend** — Vercel → Add New Project → shu repo → *Root Directory*: `backend`, Framework: **Other**.
   Environment Variables:
   `DATABASE_URL`, `BOT_TOKEN`, `ADMIN_CHAT_IDS`, `WEBHOOK_SECRET`, `ADMIN_PASSWORD`, `JWT_SECRET`, `NODE_ENV=production`,
   `WEBAPP_URL=https://<frontend-domeni>.vercel.app`
2. **Frontend** — yana Add New Project → shu repo → *Root Directory*: `frontend`, Framework: **Next.js**.
   Environment Variables:
   `BACKEND_URL=https://<backend-domeni>.vercel.app`, `NEXT_PUBLIC_SITE_URL=https://<frontend-domeni>.vercel.app`,
   `NEXT_PUBLIC_BOT_USERNAME=mira_kosmetika_bot`
3. `https://<frontend-domeni>/admin` → Sozlamalar → **“Botni ulash”** (webhook + menyu tugmasi o‘rnatiladi).
4. (Ixtiyoriy) @BotFather → `/setinline` — `@mira_kosmetika_bot <so‘z>` orqali mahsulot ulashish uchun.

> Diqqat: lokal backendni ishga tushirish webhookni o‘chiradi (polling). Keyin admin paneldagi “Botni ulash”ni qayta bosing.
