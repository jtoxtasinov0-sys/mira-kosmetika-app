// Jadvallarni yaratish: npm run migrate
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import pool from './connection.js';
import logger from '../utils/logger.js';

export async function migrate() {
  const sql = await readFile(fileURLToPath(new URL('./schema.sql', import.meta.url)), 'utf8');
  await pool.query(sql);
  logger.info('Migratsiya bajarildi');
}

// To'g'ridan-to'g'ri ishga tushirilganda
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  migrate()
    .then(() => pool.end())
    .catch((err) => {
      logger.error(err);
      process.exit(1);
    });
}
