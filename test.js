#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Cloudflare Telegram Bot Configuration\n');

// Test 1: Check if .env exists
console.log('1️⃣ Checking .env file...');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('✅ .env file exists');
} else {
  console.log('❌ .env file not found. Run: npm run setup');
  process.exit(1);
}

// Test 2: Check environment variables
console.log('\n2️⃣ Checking environment variables...');
require('dotenv').config();

const requiredVars = ['BOT_TOKEN'];
const optionalVars = ['ADMIN_USER_ID', 'TEMP_DIR', 'SESSION_FILE'];

for (const varName of requiredVars) {
  if (process.env[varName]) {
    console.log(`✅ ${varName} is set`);
  } else {
    console.log(`❌ ${varName} is missing`);
    process.exit(1);
  }
}

for (const varName of optionalVars) {
  if (process.env[varName]) {
    console.log(`✅ ${varName} is set`);
  } else {
    console.log(`⚠️  ${varName} is not set (optional)`);
  }
}

// Test 3: Check directories
console.log('\n3️⃣ Checking directories...');
const tempDir = process.env.TEMP_DIR || './temp';
const dataDir = path.dirname(process.env.SESSION_FILE || './data/session.json');

if (fs.existsSync(tempDir)) {
  console.log(`✅ Temp directory exists: ${tempDir}`);
} else {
  console.log(`⚠️  Temp directory will be created: ${tempDir}`);
}

if (fs.existsSync(dataDir)) {
  console.log(`✅ Data directory exists: ${dataDir}`);
} else {
  console.log(`⚠️  Data directory will be created: ${dataDir}`);
}

// Test 4: Check dependencies
console.log('\n4️⃣ Checking dependencies...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const dependencies = Object.keys(packageJson.dependencies);

for (const dep of dependencies) {
  try {
    require.resolve(dep);
    console.log(`✅ ${dep} is installed`);
  } catch (error) {
    console.log(`❌ ${dep} is missing. Run: npm install`);
    process.exit(1);
  }
}

// Test 5: Check main files
console.log('\n5️⃣ Checking main files...');
const mainFiles = [
  'bot.js',
  'src/config.js',
  'src/database.js',
  'src/cloudflare.js',
  'src/git.js',
  'src/keyboards.js'
];

for (const file of mainFiles) {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} is missing`);
    process.exit(1);
  }
}

// Test 6: Try to load config
console.log('\n6️⃣ Testing configuration loading...');
try {
  const config = require('./src/config');
  if (config.BOT_TOKEN) {
    console.log('✅ Configuration loads successfully');
    console.log(`✅ Bot token format: ${config.BOT_TOKEN.substring(0, 10)}...`);
  } else {
    console.log('❌ Bot token not loaded from config');
    process.exit(1);
  }
} catch (error) {
  console.log(`❌ Error loading config: ${error.message}`);
  process.exit(1);
}

console.log('\n🎉 All tests passed! Your bot is ready to run.');
console.log('\n📋 Next steps:');
console.log('1. Run: npm start');
console.log('2. Chat with your bot on Telegram');
console.log('3. Send /start to begin');
console.log('\n💡 Tip: Use npm run dev for development with auto-restart');