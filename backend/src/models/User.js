import { query } from '../database/connection.js';

const User = {
  /** Telegram foydalanuvchisini saqlash / yangilash */
  async upsert(tg) {
    if (!tg?.id) return null;
    const { rows } = await query(
      `INSERT INTO users (id, first_name, last_name, username, language_code)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (id) DO UPDATE SET
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         username = EXCLUDED.username,
         language_code = EXCLUDED.language_code,
         last_seen_at = now()
       RETURNING *`,
      [tg.id, tg.first_name || null, tg.last_name || null, tg.username || null, tg.language_code || null]
    );
    return rows[0];
  },

  async get(id) {
    const { rows } = await query(`SELECT * FROM users WHERE id = $1`, [id]);
    return rows[0] || null;
  },

  async setPhone(id, phone) {
    await query(`UPDATE users SET phone = $2 WHERE id = $1`, [id, phone]);
  },

  async count() {
    const { rows } = await query(`SELECT count(*)::int AS n FROM users`);
    return rows[0].n;
  },
};

export default User;
