// PostgreSQL (Neon) ulanishi
import pg from 'pg';
import config from '../config/default.js';
import logger from '../utils/logger.js';

if (!config.databaseUrl) {
  logger.error('DATABASE_URL topilmadi — backend/.env faylini tekshiring');
}

// bigint (Telegram ID) ni JS number sifatida qaytarish — ID'lar 2^53 dan kichik
pg.types.setTypeParser(20, (v) => Number(v));

// Serverless (Vercel) muhitida bitta funksiya — bitta ulanish yetarli
const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  max: config.isVercel ? 1 : 5,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 15_000,
});

pool.on('error', (err) => logger.error('PG pool xatosi:', err.message));

export const query = (text, params) => pool.query(text, params);

export async function tx(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export default pool;
