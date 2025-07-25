# 🔍 Repository Analyzer Guide

Bot Telegram ini dilengkapi dengan fitur **Repository Analyzer** yang dapat menganalisis repository GitHub secara otomatis dan menghasilkan konfigurasi `wrangler.toml` yang optimal untuk Cloudflare Workers.

## 🎯 Tujuan

Fitur ini dibuat untuk memenuhi kebutuhan:

1️⃣ **Cek repo GitHub:**
- Apakah ada file `wrangler.toml`?
  - Kalau ada ➜ pakai dan update jika perlu
  - Kalau tidak ➜ buat otomatis

2️⃣ **Baca isi Worker:**
- Kalau ada `export default` atau `import` ➜ format = "modules"
- Kalau ada `addEventListener('fetch')` ➜ format = "service-worker"
- Kalau ada `node:` ➜ aktifkan `compatibility_flags = ["nodejs_compat_v2"]`

3️⃣ **Buat `wrangler.toml` optimal**

## 🔧 Cara Kerja

### 1. Analisis Format Worker

Bot akan menganalisis file JavaScript untuk mendeteksi format:

#### ES Modules Format
```javascript
export default {
  async fetch(request, env, ctx) {
    return new Response('Hello World');
  }
};
```
**Hasil:** `format = "modules"`

#### Service Worker Format
```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  return new Response('Hello World');
}
```
**Hasil:** `format = "service-worker"`

### 2. Deteksi Node.js Compatibility

Bot akan mencari pola-pola yang memerlukan Node.js compatibility:

#### Node.js Imports
```javascript
import { readFile } from 'node:fs/promises';
import crypto from 'node:crypto';
```

#### Node.js Requires
```javascript
const fs = require('node:fs');
const path = require('node:path');
```

#### Node.js APIs
```javascript
// Process environment
process.env.NODE_ENV

// Node.js globals
__dirname
__filename

// Built-in modules
require('fs')
require('path')
require('crypto')
```

**Hasil:** `compatibility_flags = ["nodejs_compat_v2"]`

### 3. File Worker yang Dicari

Bot akan mencari file Worker dalam urutan prioritas:

1. `index.js`
2. `worker.js`
3. `src/index.js`
4. `src/worker.js`
5. `main.js`
6. `app.js`
7. `server.js`

## 📝 Contoh Konfigurasi yang Dihasilkan

### Basic Configuration
```toml
name = "my-worker"
main = "worker.js"
compatibility_date = "2024-12-19"

[build.upload]
format = "modules"
```

### With Node.js Compatibility
```toml
name = "my-worker"
main = "index.js"
compatibility_date = "2024-12-19"

[build.upload]
format = "modules"

compatibility_flags = ["nodejs_compat_v2"]
```

### Service Worker Format
```toml
name = "legacy-worker"
main = "worker.js"
compatibility_date = "2024-12-19"

[build.upload]
format = "service-worker"
```

## 🚀 Menggunakan Fitur

### Melalui Bot Telegram

1. **Mulai analisis:**
   ```
   /start → 🔍 AnalysisRepo
   ```

2. **Kirim URL repository:**
   ```
   https://github.com/username/my-worker
   ```

3. **Bot akan menampilkan hasil analisis:**
   ```
   🔍 Analisis Repository:

   📦 Repository: https://github.com/username/my-worker
   📝 Worker Name: my-worker
   📄 Main File: index.js

   ✅ wrangler.toml: Dibuat otomatis

   ⚙️ Konfigurasi Worker:
   • Format: modules
   • Node.js Compatibility: ✅ Diaktifkan
   • Tanggal Compatibility: 2024-12-19

   📁 File Worker ditemukan:
   • index.js (ES modules, Node.js)
   • src/utils.js (ES modules)

   ✅ Konfigurasi berhasil dibuat!
   ```

4. **Lihat konfigurasi yang dihasilkan:**
   - Klik **📋 Lihat Konfigurasi**
   - Copy konfigurasi ke file `wrangler.toml`

## 🔍 Deteksi Cerdas

### Format Detection
- ✅ ES Modules (`export default`, `import`)
- ✅ Service Worker (`addEventListener('fetch')`)
- ✅ CommonJS (`module.exports`, `require()`)
- ✅ Mixed formats (prioritas ES Modules)

### Node.js Compatibility Detection
- ✅ Node.js imports (`node:*`)
- ✅ Built-in modules (`fs`, `path`, `crypto`, dll.)
- ✅ Process APIs (`process.env`)
- ✅ Node.js globals (`__dirname`, `__filename`)

### Worker Name Extraction
- ✅ Dari URL repository: `my-awesome-worker`
- ✅ Sanitasi karakter: `my_awesome_worker` → `my-awesome-worker`
- ✅ Lowercase conversion

## 🛡️ Error Handling

Bot menangani berbagai skenario error:

- ❌ Repository tidak ditemukan
- ❌ Repository private
- ❌ Tidak ada file JavaScript
- ❌ URL GitHub tidak valid
- ❌ Network timeout

## 💡 Tips dan Best Practices

### 1. Repository Structure
```
my-worker/
├── index.js          # Main worker file
├── wrangler.toml      # Optional, akan diupdate/dibuat
├── package.json       # Optional
└── src/
    ├── handlers/      # Optional
    └── utils/         # Optional
```

### 2. Worker Code Best Practices

#### ✅ Recommended (ES Modules)
```javascript
export default {
  async fetch(request, env, ctx) {
    // Your worker logic
    return new Response('Hello World');
  }
};
```

#### ⚠️ Legacy (Service Worker)
```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});
```

### 3. Node.js Compatibility
Gunakan hanya jika benar-benar diperlukan:
```javascript
// ✅ Good: Cloudflare APIs
const response = await fetch('https://api.example.com');

// ⚠️ Use with caution: Node.js APIs
import { readFile } from 'node:fs/promises';
```

## 🔄 Update Existing Configuration

Jika repository sudah memiliki `wrangler.toml`, bot akan:

1. ✅ Membaca konfigurasi existing
2. 🔍 Menganalisis apakah sudah optimal
3. 📝 Update dengan konfigurasi yang lebih baik
4. 💾 Preserve konfigurasi custom (vars, KV, dll.)

## 🚀 Integration dengan Deploy

Setelah analisis, Anda dapat langsung deploy:

1. **Copy konfigurasi** yang dihasilkan
2. **Commit ke repository** sebagai `wrangler.toml`
3. **Deploy** menggunakan fitur **🚀 DeployGit**

---

## 📚 Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler Configuration](https://developers.cloudflare.com/workers/wrangler/configuration/)
- [Node.js Compatibility](https://developers.cloudflare.com/workers/runtime-apis/nodejs/)