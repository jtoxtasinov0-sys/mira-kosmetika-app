import { query } from '../database/connection.js';
import config from '../config/default.js';

// Admin paneldan o'zgartiriladigan kalitlar
export const SETTING_KEYS = Object.keys(config.defaults);

const Setting = {
  async all() {
    const { rows } = await query(`SELECT key, value FROM settings`);
    const out = { ...config.defaults };
    for (const r of rows) if (SETTING_KEYS.includes(r.key)) out[r.key] = r.value;
    return out;
  },

  async save(values) {
    for (const key of SETTING_KEYS) {
      if (values[key] === undefined) continue;
      await query(
        `INSERT INTO settings (key, value) VALUES ($1,$2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [key, String(values[key] ?? '').slice(0, 1000)]
      );
    }
    return Setting.all();
  },
};

export default Setting;
