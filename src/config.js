require('dotenv').config();

module.exports = {
  BOT_TOKEN: process.env.BOT_TOKEN,
  ADMIN_USER_ID: process.env.ADMIN_USER_ID,
  TEMP_DIR: process.env.TEMP_DIR || './temp',
  SESSION_FILE: process.env.SESSION_FILE || './data/session.json',
  
  CLOUDFLARE: {
    API_BASE: 'https://api.cloudflare.com/client/v4',
    WORKERS_SUBDOMAIN: 'workers.dev'
  },
  
  MESSAGES: {
    WELCOME: `⚡ *Selamat datang di BOT CLOUDFLARE!*

🔹 *Tujuan Bot*: Deploy & kelola Cloudflare Workers dari GitHub atau File JS.
🔹 *Peraturan Bot*:
- Gunakan dengan bijak.
- Tidak untuk aktivitas ilegal.
🔹 *Risiko*:
- Segala risiko ditanggung pengguna sendiri.`,

    LOGIN_SUCCESS: (email, accountId, zoneId) => `🔐 *Login Berhasil!*

*Data Akun:*
──────────────
📧 Email: ${email}
🆔 Account ID: ${accountId}
🌐 Zone ID: ${zoneId}
──────────────

Silakan pilih fitur:`,

    DEPLOY_SUCCESS: (name, link) => `──────────────
✅ *Deploy Berhasil!*
🔹 Nama Worker: ${name}
🔹 Link: ${link}
──────────────`,

    UPLOAD_SUCCESS: (name, link) => `──────────────
✅ *Upload & Deploy Berhasil!*
🔹 Nama Worker: ${name}
🔹 Link: ${link}
──────────────`,

    DELETE_SUCCESS: (name) => `──────────────
✅ *Worker Dihapus!*
🔹 Nama: ${name}
──────────────`
  }
};