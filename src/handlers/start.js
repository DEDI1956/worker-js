const config = require('../config');
const db = require('../database');
const Keyboards = require('../keyboards');

async function handleStart(ctx) {
  const userId = ctx.from.id;
  
  // Clear any existing step data
  await db.clearUserStep(userId);
  
  // Send welcome message with agreement button
  await ctx.replyWithMarkdown(
    config.MESSAGES.WELCOME,
    Keyboards.welcome()
  );
}

async function handleAgree(ctx) {
  const userId = ctx.from.id;
  
  // Update user step to request API token
  await db.updateUserStep(userId, 'awaiting_api_token');
  
  await ctx.editMessageText(
    '🔑 *Silakan kirim API Token Cloudflare Anda*\n\n' +
    '📝 *Cara mendapatkan API Token:*\n' +
    '1. Buka https://dash.cloudflare.com/profile/api-tokens\n' +
    '2. Klik "Create Token"\n' +
    '3. Pilih "Custom token"\n' +
    '4. Berikan permission: Zone:Zone:Read, Zone:Zone Settings:Read, Account:Cloudflare Workers:Edit\n' +
    '5. Copy token yang dihasilkan\n\n' +
    '⚠️ *Token akan disimpan dengan aman untuk sesi ini.*',
    { parse_mode: 'Markdown' }
  );
}

module.exports = {
  handleStart,
  handleAgree
};