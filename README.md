# 🚀 Cloudflare Workers Telegram Bot

Bot Telegram untuk mengelola Cloudflare Workers dengan mudah. Deploy dan kelola worker dari GitHub repository atau upload file JavaScript langsung melalui Telegram.

## ✨ Fitur

- 🔐 **Autentikasi Secure** - Login dengan API Token, Account ID, dan Zone ID Cloudflare
- 🚀 **Deploy dari GitHub** - Clone repository dan deploy otomatis ke Cloudflare Workers
- 📂 **Upload JavaScript** - Upload file .js atau paste kode langsung
- 🔍 **Analisis Repository** - Analisis otomatis format Worker dan generate `wrangler.toml` optimal
- 📜 **List Workers** - Lihat semua workers yang sudah di-deploy
- 🗑️ **Delete Workers** - Hapus workers dengan konfirmasi
- 💾 **Session Management** - Data login tersimpan dengan aman

## 🛠️ Instalasi

### 1. Clone Repository

```bash
git clone <repository-url>
cd cloudflare-telegram-bot
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment

```bash
cp .env.example .env
```

Edit file `.env` dan isi dengan data Anda:

```env
BOT_TOKEN=your_bot_token_from_botfather
ADMIN_USER_ID=your_telegram_user_id
TEMP_DIR=./temp
SESSION_FILE=./data/session.json
```

### 4. Buat Bot Telegram

1. Chat dengan [@BotFather](https://t.me/botfather) di Telegram
2. Gunakan perintah `/newbot`
3. Ikuti instruksi untuk membuat bot baru
4. Copy token yang diberikan ke file `.env`

### 5. Jalankan Bot

```bash
# Development
npm run dev

# Production
npm start
```

## 📋 Cara Menggunakan

### 1. Mulai Bot
- Kirim `/start` ke bot
- Klik tombol **✅ Saya Setuju**

### 2. Login Cloudflare
- Kirim **API Token** Cloudflare Anda
- Kirim **Account ID** Cloudflare
- Kirim **Zone ID** Cloudflare

### 3. Gunakan Fitur

#### 🚀 Deploy dari GitHub
1. Klik **🚀 DeployGit**
2. Masukkan nama worker
3. Masukkan URL repository GitHub
4. Bot akan clone dan deploy otomatis

#### 📂 Upload JavaScript
1. Klik **📂 UploadJS**
2. Masukkan nama worker
3. Upload file .js atau paste kode JavaScript
4. Bot akan deploy ke Cloudflare

#### 🔍 Analisis Repository
1. Klik **🔍 AnalysisRepo**
2. Masukkan URL repository GitHub
3. Bot akan menganalisis:
   - ✅ Cek keberadaan file `wrangler.toml`
   - 🔍 Deteksi format Worker (modules/service-worker)
   - 🔧 Deteksi kebutuhan Node.js compatibility
   - 📝 Generate/update konfigurasi `wrangler.toml` optimal
4. Lihat hasil analisis dan konfigurasi yang dihasilkan

#### 📜 List Workers
- Klik **📜 ListWrk** untuk melihat semua workers

#### 🗑️ Delete Workers
- Klik **🗑️ DelWrk** untuk menghapus workers

## 🔧 Struktur Project

```
cloudflare-telegram-bot/
├── src/
│   ├── handlers/
│   │   ├── start.js          # Handler untuk /start dan agreement
│   │   ├── auth.js           # Handler untuk autentikasi
│   │   ├── deploy.js         # Handler untuk deploy GitHub
│   │   ├── upload.js         # Handler untuk upload JS
│   │   ├── workers.js        # Handler untuk list/delete workers
│   │   ├── analyze.js        # Handler untuk analisis repository
│   │   └── wrangler-analyzer.js # Core logic untuk analisis wrangler.toml
│   ├── config.js             # Konfigurasi dan environment variables
│   ├── database.js           # Database management dengan lowdb
│   ├── cloudflare.js         # Cloudflare API service
│   ├── git.js               # Git operations dengan simple-git
│   └── keyboards.js          # Telegram inline keyboards
├── data/                     # Database dan session files
├── temp/                     # Temporary files untuk git clone
├── bot.js                    # Main bot file
├── package.json
├── .env.example
└── README.md
```

## 🔑 Mendapatkan Cloudflare Credentials

### API Token
1. Buka [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Klik **Create Token**
3. Pilih **Custom token**
4. Berikan permissions:
   - `Zone:Zone:Read`
   - `Zone:Zone Settings:Read`
   - `Account:Cloudflare Workers:Edit`
5. Copy token yang dihasilkan

### Account ID & Zone ID
1. Buka [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Pilih domain Anda
3. Scroll ke bawah di sidebar kanan
4. Copy **Account ID** dan **Zone ID**

## 📝 Format Repository GitHub

Repository GitHub harus memiliki:

- **File JavaScript utama** (index.js, worker.js, src/index.js, dll)
- **Opsional**: `wrangler.toml` untuk konfigurasi

### Contoh Worker Sederhana

```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  return new Response('Hello World from Cloudflare Worker!', {
    headers: { 'content-type': 'text/plain' }
  })
}
```

## 🚨 Keamanan

- API Token disimpan terenkripsi dalam session
- Session file hanya dapat diakses oleh aplikasi
- Validasi input untuk mencegah injection
- Rate limiting untuk API calls

## 🐛 Troubleshooting

### Bot tidak merespon
- Pastikan `BOT_TOKEN` benar di file `.env`
- Cek koneksi internet
- Lihat log error di console

### Deploy gagal
- Pastikan API Token memiliki permission yang benar
- Cek format repository GitHub
- Pastikan file JavaScript valid

### Error "Invalid token"
- Generate API Token baru di Cloudflare
- Pastikan permission sudah sesuai
- Coba login ulang dengan `/start`

## 📦 Dependencies

- **telegraf** - Telegram Bot Framework
- **simple-git** - Git operations
- **axios** - HTTP client untuk Cloudflare API
- **lowdb** - JSON database untuk session
- **dotenv** - Environment variables
- **fs-extra** - File system utilities

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - lihat file [LICENSE](LICENSE) untuk detail.

## ⚠️ Disclaimer

- Gunakan bot dengan bijak dan bertanggung jawab
- Tidak untuk aktivitas ilegal
- Segala risiko penggunaan ditanggung pengguna
- Bot ini tidak berafiliasi dengan Cloudflare Inc.