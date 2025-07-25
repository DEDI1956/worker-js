# 🚀 Cloudflare Workers Deployment Guide

## ✅ Revisi Terbaru - Format Modern

Kode telah diperbarui untuk menggunakan **ES Modules** format yang didukung oleh Cloudflare Workers modern.

### 📁 File yang Telah Diperbaiki

#### 1. `worker.js` - Worker Utama
```javascript
export default {
  async fetch(request, env, ctx) {
    // Logic worker di sini
    return new Response("Hello from Cloudflare Worker!");
  },
};
```

#### 2. `wrangler.toml` - Konfigurasi Deployment
```toml
name = "cloudflare-worker-bot"
main = "worker.js"
compatibility_date = "2024-12-19"

[build.upload]
format = "modules"
```

### 🔄 Perubahan dari Format Lama

| Format Lama (❌) | Format Baru (✅) |
|-----------------|-----------------|
| `addEventListener('fetch', ...)` | `export default { async fetch(...) }` |
| `require()` | `import` |
| `module.exports` | `export default` |
| Service Worker API | ES Modules |

### 🛠️ Fitur Auto-Conversion

Bot sekarang secara otomatis mengkonversi:

1. **Legacy addEventListener format** → Modern ES Modules
2. **Node.js require/exports** → ES Modules  
3. **Script tanpa format** → Wrapped dalam modern format
4. **wrangler.toml lama** → Updated dengan `format = "modules"`

### 📝 Contoh Penggunaan

#### Deploy dari GitHub Repository
1. Repository harus berisi file JavaScript worker
2. Bot akan otomatis:
   - Mencari file utama (`index.js`, `worker.js`, dll)
   - Mengkonversi ke format modern jika diperlukan
   - Membuat `wrangler.toml` jika tidak ada
   - Deploy ke Cloudflare

#### Format Worker yang Didukung

**✅ Modern ES Modules (Recommended)**
```javascript
export default {
  async fetch(request, env, ctx) {
    return new Response("Hello World!");
  }
};
```

**✅ Legacy Format (Auto-converted)**
```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
});

async function handleRequest(request) {
  return new Response("Hello World!");
}
```

**✅ Node.js Style (Auto-converted)**
```javascript
const handler = async (request) => {
  return new Response("Hello World!");
};

module.exports = handler;
```

### 🔧 Konfigurasi wrangler.toml

#### Minimal Configuration
```toml
name = "my-worker"
main = "worker.js"
compatibility_date = "2024-12-19"

[build.upload]
format = "modules"
```

#### Extended Configuration
```toml
name = "my-worker"
main = "worker.js"
compatibility_date = "2024-12-19"

[build.upload]
format = "modules"

# Environment variables
[vars]
API_KEY = "your-api-key"
ENVIRONMENT = "production"

# KV Namespace
[[kv_namespaces]]
binding = "MY_KV"
id = "your-kv-namespace-id"

# Custom routes
[[routes]]
pattern = "example.com/*"
zone_name = "example.com"
```

### 🚀 Deploy Commands

Jika menggunakan Wrangler CLI:

```bash
# Install Wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler auth login

# Deploy worker
wrangler deploy
```

### 📚 Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [ES Modules in Workers](https://developers.cloudflare.com/workers/learning/migrating-to-module-workers/)

### ⚠️ Important Notes

1. **Compatibility Date**: Selalu gunakan tanggal terbaru untuk fitur terbaru
2. **Format Modules**: Wajib untuk ES Modules syntax
3. **Auto-Conversion**: Bot otomatis mengkonversi format lama
4. **Error Handling**: Bot akan memberikan error message yang jelas jika ada masalah

### 🔍 Troubleshooting

#### Error: "Script parse error"
- Pastikan syntax JavaScript valid
- Cek tidak ada `require()` yang tidak dikonversi
- Pastikan ada `export default`

#### Error: "Invalid wrangler.toml"
- Pastikan ada `compatibility_date`
- Pastikan ada `format = "modules"`
- Pastikan `main` menunjuk ke file yang benar

#### Worker tidak merespons
- Cek function `fetch` ada dan return `Response`
- Cek tidak ada infinite loop
- Cek error di Cloudflare dashboard