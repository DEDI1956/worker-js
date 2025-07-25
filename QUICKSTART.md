# 🚀 Quick Start Guide

Panduan cepat untuk menjalankan Cloudflare Telegram Bot dalam 5 menit!

## 📋 Prerequisites

- Node.js 16+ terinstall
- Bot Telegram (dari @BotFather)
- Akun Cloudflare dengan API Token

## ⚡ Setup Cepat

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Konfigurasi
```bash
npm run setup
```

Ikuti instruksi dan masukkan:
- **Bot Token** dari @BotFather
- **Admin User ID** (opsional)

### 3. Jalankan Bot
```bash
npm start
```

### 4. Test Bot
1. Chat dengan bot Anda di Telegram
2. Kirim `/start`
3. Klik **✅ Saya Setuju**
4. Masukkan credentials Cloudflare Anda

## 🔑 Mendapatkan Cloudflare Credentials

### API Token
1. Buka https://dash.cloudflare.com/profile/api-tokens
2. **Create Token** → **Custom token**
3. Permissions:
   - `Zone:Zone:Read`
   - `Zone:Zone Settings:Read` 
   - `Account:Cloudflare Workers:Edit`

### Account ID & Zone ID
1. Buka https://dash.cloudflare.com
2. Pilih domain Anda
3. Copy dari sidebar kanan

## 🎯 Fitur Utama

- **🚀 DeployGit**: Deploy dari GitHub repository
- **📂 UploadJS**: Upload file JavaScript atau paste kode
- **📜 ListWrk**: Lihat semua workers
- **🗑️ DelWrk**: Hapus workers

## 🔧 Troubleshooting

**Bot tidak merespon?**
- Cek `BOT_TOKEN` di file `.env`
- Pastikan bot sudah di-start dengan @BotFather

**Deploy gagal?**
- Pastikan API Token memiliki permission yang benar
- Cek format repository GitHub
- Pastikan file JavaScript valid

**Need help?**
- Baca `README.md` untuk dokumentasi lengkap
- Cek folder `examples/` untuk contoh worker

---

✅ **Selamat! Bot Anda sudah siap digunakan!**