#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function setup() {
  console.log('🚀 Cloudflare Telegram Bot Setup');
  console.log('=================================\n');
  
  // Check if .env already exists
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const overwrite = await askQuestion('❓ File .env sudah ada. Timpa? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('✅ Setup dibatalkan. Gunakan file .env yang ada.');
      rl.close();
      return;
    }
  }
  
  console.log('📝 Silakan isi informasi berikut:\n');
  
  // Get bot token
  const botToken = await askQuestion('🤖 Bot Token (dari @BotFather): ');
  if (!botToken) {
    console.log('❌ Bot Token wajib diisi!');
    rl.close();
    return;
  }
  
  // Get admin user ID (optional)
  const adminUserId = await askQuestion('👤 Admin User ID (opsional): ');
  
  // Get temp directory
  const tempDir = await askQuestion('📁 Temp Directory (default: ./temp): ') || './temp';
  
  // Get session file path
  const sessionFile = await askQuestion('💾 Session File (default: ./data/session.json): ') || './data/session.json';
  
  // Create .env content
  const envContent = `# Telegram Bot Token from @BotFather
BOT_TOKEN=${botToken}

# Optional: Admin user ID for bot management
${adminUserId ? `ADMIN_USER_ID=${adminUserId}` : '# ADMIN_USER_ID=your_telegram_user_id'}

# Temporary directory for cloning repositories
TEMP_DIR=${tempDir}

# Session file path
SESSION_FILE=${sessionFile}
`;
  
  // Write .env file
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ File .env berhasil dibuat!');
  } catch (error) {
    console.log(`\n❌ Gagal membuat file .env: ${error.message}`);
    rl.close();
    return;
  }
  
  // Create directories
  const dataDir = path.dirname(sessionFile);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`✅ Direktori ${dataDir} dibuat!`);
  }
  
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
    console.log(`✅ Direktori ${tempDir} dibuat!`);
  }
  
  console.log('\n🎉 Setup selesai!');
  console.log('\n📋 Langkah selanjutnya:');
  console.log('1. Jalankan: npm start');
  console.log('2. Chat dengan bot Anda di Telegram');
  console.log('3. Kirim /start untuk memulai\n');
  
  console.log('📖 Untuk mendapatkan Cloudflare credentials:');
  console.log('• API Token: https://dash.cloudflare.com/profile/api-tokens');
  console.log('• Account & Zone ID: https://dash.cloudflare.com (pilih domain)\n');
  
  rl.close();
}

setup().catch(console.error);