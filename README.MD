# Cloudflare Worker Telegram Bot (Node.js)

Bot Telegram untuk deploy, kelola, dan monitoring Cloudflare Worker oleh member, semua akun/cloudflare user sendiri, tanpa pakai API-mu.

## Fitur
- Setup akun Cloudflare per user (token/account/zone id)
- Deploy Worker: input nama & kode js, tombol emoji
- Menu utama tombol emoji
- Siap dikembangkan list/delete worker, admin panel, dsb

## Cara Pakai & Deploy

1. **Isi config.json**
   ```json
   {
     "TELEGRAM_BOT_TOKEN": "ISI_TOKEN_BOT_MU",
     "ADMIN_ID": 123456789,
     "CLOUDFLARE_API_ENDPOINT": "https://api.cloudflare.com/client/v4/accounts"
   }
   ```
2. **Install dependensi**
   ```
   npm install
   ```
3. **Jalankan lokal**
   ```
   node bot.js
   ```
4. **Deploy ke Railway**
   - Upload ke GitHub
   - Buat project Railway, pilih repo ini, jalankan

## Note
- Bot ini _stateless_ per user (user setup sekali, baru bisa deploy)
- Untuk fitur admin/ban, tinggal tambah handler baru
