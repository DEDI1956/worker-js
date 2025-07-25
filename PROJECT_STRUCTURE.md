# 📁 Project Structure

Struktur lengkap project Cloudflare Telegram Bot:

```
cloudflare-telegram-bot/
├── 📄 bot.js                    # Main bot file - entry point aplikasi
├── 📄 package.json              # NPM package configuration
├── 📄 package-lock.json         # NPM dependency lock
├── 📄 .env.example              # Template environment variables
├── 📄 .gitignore               # Git ignore rules
├── 📄 README.md                # Dokumentasi lengkap
├── 📄 QUICKSTART.md            # Panduan cepat
├── 📄 PROJECT_STRUCTURE.md     # File ini
├── 📄 setup.js                 # Script setup interaktif
├── 📄 test.js                  # Script test konfigurasi
│
├── 📁 src/                     # Source code utama
│   ├── 📄 config.js            # Konfigurasi dan environment variables
│   ├── 📄 database.js          # Database management (lowdb)
│   ├── 📄 cloudflare.js        # Cloudflare API service
│   ├── 📄 git.js              # Git operations (simple-git)
│   ├── 📄 keyboards.js         # Telegram inline keyboards
│   │
│   └── 📁 handlers/            # Bot message handlers
│       ├── 📄 start.js         # /start command & agreement
│       ├── 📄 auth.js          # Authentication flow
│       ├── 📄 deploy.js        # GitHub deployment
│       ├── 📄 upload.js        # JavaScript file upload
│       └── 📄 workers.js       # List & delete workers
│
├── 📁 examples/                # Contoh kode
│   └── 📄 simple-worker.js     # Contoh Cloudflare Worker
│
├── 📁 data/                    # Database & session files
│   └── 📄 session.json         # User sessions (auto-generated)
│
├── 📁 temp/                    # Temporary files
│   └── 📁 repo_*               # Cloned repositories (auto-cleaned)
│
└── 📁 node_modules/            # NPM dependencies
```

## 🔧 File Descriptions

### Core Files

- **`bot.js`** - Entry point utama, inisialisasi bot dan routing
- **`package.json`** - Dependencies dan scripts NPM
- **`.env`** - Environment variables (dibuat saat setup)

### Source Code (`src/`)

- **`config.js`** - Load environment variables dan konstanta
- **`database.js`** - Manajemen session user dengan lowdb
- **`cloudflare.js`** - Service untuk Cloudflare API calls
- **`git.js`** - Service untuk Git operations (clone, read files)
- **`keyboards.js`** - Telegram inline keyboard layouts

### Handlers (`src/handlers/`)

- **`start.js`** - Handle /start command dan agreement flow
- **`auth.js`** - Handle login flow (API token, account ID, zone ID)
- **`deploy.js`** - Handle GitHub repository deployment
- **`upload.js`** - Handle JavaScript file upload & paste
- **`workers.js`** - Handle list workers dan delete operations

### Utility Files

- **`setup.js`** - Interactive setup script untuk konfigurasi awal
- **`test.js`** - Test script untuk validasi konfigurasi
- **`QUICKSTART.md`** - Quick start guide untuk user

### Auto-Generated

- **`data/session.json`** - Database file untuk user sessions
- **`temp/repo_*`** - Temporary directories untuk cloned repositories

## 🚀 Scripts Available

```bash
npm run setup    # Interactive setup
npm test        # Test configuration
npm start       # Start bot (production)
npm run dev     # Start bot (development with auto-restart)
```

## 📦 Dependencies

### Production
- **telegraf** - Telegram Bot Framework
- **simple-git** - Git operations
- **axios** - HTTP client
- **lowdb** - JSON database
- **dotenv** - Environment variables
- **fs-extra** - Enhanced file system

### Development
- **node --watch** - Auto-restart untuk development

## 🔐 Security Features

- Environment variables untuk sensitive data
- Session encryption dalam database
- Input validation untuk semua user input
- Secure file handling untuk uploads
- Auto-cleanup untuk temporary files

## 🔄 Data Flow

1. **User Input** → `bot.js` → **Handler**
2. **Handler** → **Service** (cloudflare/git) → **API Call**
3. **Result** → **Database** (session update) → **Response**

## 🛠️ Development Tips

- Gunakan `npm run dev` untuk development
- Check logs di console untuk debugging
- Test dengan `npm test` sebelum deploy
- Backup `data/session.json` untuk production