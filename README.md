# MIRA Cosmetics — Telegram Mini App

Koreyadan kosmetika sotadigan do‘kon uchun Telegram Mini App: **dona va optom** narxlar, karta orqali to‘lov (chek yuklanadi), admin panel va Telegram bot.

```
backend/   Express + grammY (bot) + PostgreSQL (Neon)   → Vercel loyiha #1
frontend/  Next.js 16 (App Router) + Tailwind + Zustand  → Vercel loyiha #2
```

## Imkoniyatlar

- **Dona / Optom** rejimi (🇰🇷 tugma): narxlar butun ilovada darhol o‘zgaradi, optomda minimal miqdor nazorat qilinadi.
- 9 kategoriya, 61 mahsulot rasmlari bilan (`backend/seed/`).
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

## Joylash: backend → Render, frontend → Vercel

**Backend (Render → New Web Service → shu repo)**
- Root Directory: `backend` · Build: `npm ci --omit=dev` · Start: `npm start` · Health Check Path: `/api/health`
- Environment: `backend/.env` dagilar (`PORT` dan tashqari), shuningdek `NODE_ENV=production`, `BOT_MODE=webhook`,
  `WEBAPP_URL=https://mira-kosmetika-app.vercel.app`
- Bot webhooki servis ishga tushganda avtomatik o‘rnatiladi (`RENDER_EXTERNAL_URL/api/bot/webhook`).

**Frontend (Vercel, Root Directory: `frontend`, Framework: Next.js)**
- `BACKEND_URL=https://mira-kosmetika-api.onrender.com`
- `NEXT_PUBLIC_SITE_URL=https://mira-kosmetika-app.vercel.app`
- `NEXT_PUBLIC_BOT_USERNAME=mira_kosmetika_bot`

**Keyin**
1. Botga `/id` yuboring → raqamni Render’dagi `ADMIN_CHAT_IDS` ga yozing (buyurtmalar shu chatga keladi).
2. (Ixtiyoriy) @BotFather → `/setinline` — `@mira_kosmetika_bot <so‘z>` orqali mahsulot ulashish uchun.
3. Render Free tarifi 15 daqiqa harakatsizlikdan keyin uxlaydi; tez javob uchun Starter tarifi yoki UptimeRobot bilan
   `https://mira-kosmetika-api.onrender.com/api/health` ni har 5 daqiqada “ping” qilib turing.

> Diqqat: backendni lokal ishga tushirish webhookni o‘chiradi (polling). Keyin Render servisini qayta ishga tushiring
> yoki admin panel → Sozlamalar → “Botni ulash”ni bosing.
