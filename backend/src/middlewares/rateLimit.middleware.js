// Oddiy xotiradagi cheklov (bitta instansiya uchun) — spam buyurtma va parol tanlashdan himoya
export function rateLimit({ windowMs, max }) {
  const hits = new Map();
  return (req, res, next) => {
    const key = req.tgUser?.id || req.get('x-forwarded-for')?.split(',')[0].trim() || req.ip;
    const now = Date.now();
    const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (arr.length >= max) return res.status(429).json({ error: "Juda ko'p urinish, birozdan keyin qayta urinib ko'ring" });
    arr.push(now);
    hits.set(key, arr);
    if (hits.size > 5000) hits.clear();
    next();
  };
}
