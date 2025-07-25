const config = require('../config');
const db = require('../database');
const cloudflare = require('../cloudflare');
const Keyboards = require('../keyboards');

async function handleAuthFlow(ctx) {
  const userId = ctx.from.id;
  const user = await db.getUser(userId);
  
  if (!user || !user.currentStep) {
    return;
  }
  
  const messageText = ctx.message.text;
  
  switch (user.currentStep) {
    case 'awaiting_api_token':
      await handleApiToken(ctx, messageText);
      break;
      
    case 'awaiting_account_id':
      await handleAccountId(ctx, messageText);
      break;
      
    case 'awaiting_zone_id':
      await handleZoneId(ctx, messageText);
      break;
  }
}

async function handleApiToken(ctx, token) {
  const userId = ctx.from.id;
  
  // Show processing message
  const processingMsg = await ctx.reply('🔄 *Memvalidasi API Token...*', { parse_mode: 'Markdown' });
  
  // Validate token
  const validation = await cloudflare.validateToken(token);
  
  if (!validation.success) {
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      processingMsg.message_id,
      null,
      `❌ *Token tidak valid!*\n\n*Error:* ${validation.error}\n\nSilakan kirim token yang benar.`,
      { parse_mode: 'Markdown' }
    );
    return;
  }
  
  // Save token and email
  await db.setUser(userId, {
    apiToken: token,
    email: validation.email
  });
  
  // Update step to request Account ID
  await db.updateUserStep(userId, 'awaiting_account_id');
  
  await ctx.telegram.editMessageText(
    ctx.chat.id,
    processingMsg.message_id,
    null,
    `✅ *Token valid!*\n📧 Email: ${validation.email}\n\n` +
    '🆔 *Sekarang kirim Account ID Cloudflare Anda*\n\n' +
    '📝 *Cara mendapatkan Account ID:*\n' +
    '1. Buka https://dash.cloudflare.com\n' +
    '2. Pilih domain Anda\n' +
    '3. Scroll ke bawah di sidebar kanan\n' +
    '4. Copy "Account ID"',
    { parse_mode: 'Markdown' }
  );
}

async function handleAccountId(ctx, accountId) {
  const userId = ctx.from.id;
  
  // Basic validation
  if (!accountId || accountId.length < 10) {
    await ctx.reply('❌ *Account ID tidak valid!*\n\nAccount ID harus berupa string panjang. Silakan coba lagi.', 
      { parse_mode: 'Markdown' });
    return;
  }
  
  // Save Account ID
  await db.setUser(userId, { accountId: accountId.trim() });
  
  // Update step to request Zone ID
  await db.updateUserStep(userId, 'awaiting_zone_id');
  
  await ctx.reply(
    `✅ *Account ID tersimpan!*\n🆔 ${accountId}\n\n` +
    '🌐 *Sekarang kirim Zone ID Cloudflare Anda*\n\n' +
    '📝 *Cara mendapatkan Zone ID:*\n' +
    '1. Buka https://dash.cloudflare.com\n' +
    '2. Pilih domain Anda\n' +
    '3. Scroll ke bawah di sidebar kanan\n' +
    '4. Copy "Zone ID"',
    { parse_mode: 'Markdown' }
  );
}

async function handleZoneId(ctx, zoneId) {
  const userId = ctx.from.id;
  
  // Basic validation
  if (!zoneId || zoneId.length < 10) {
    await ctx.reply('❌ *Zone ID tidak valid!*\n\nZone ID harus berupa string panjang. Silakan coba lagi.',
      { parse_mode: 'Markdown' });
    return;
  }
  
  const user = await db.getUser(userId);
  
  // Show processing message
  const processingMsg = await ctx.reply('🔄 *Menyelesaikan setup...*', { parse_mode: 'Markdown' });
  
  // Save Zone ID
  await db.setUser(userId, { zoneId: zoneId.trim() });
  
  // Clear current step
  await db.clearUserStep(userId);
  
  // Get updated user data
  const updatedUser = await db.getUser(userId);
  
  // Send success message with main menu
  await ctx.telegram.editMessageText(
    ctx.chat.id,
    processingMsg.message_id,
    null,
    config.MESSAGES.LOGIN_SUCCESS(updatedUser.email, updatedUser.accountId, updatedUser.zoneId),
    {
      parse_mode: 'Markdown',
      reply_markup: Keyboards.mainMenu().reply_markup
    }
  );
}

async function handleBackToMenu(ctx) {
  const userId = ctx.from.id;
  
  // Check if user is logged in
  const isLoggedIn = await db.isUserLoggedIn(userId);
  
  if (!isLoggedIn) {
    await ctx.editMessageText(
      '❌ *Anda belum login!*\n\nSilakan gunakan /start untuk memulai proses login.',
      { parse_mode: 'Markdown' }
    );
    return;
  }
  
  const user = await db.getUser(userId);
  
  await ctx.editMessageText(
    config.MESSAGES.LOGIN_SUCCESS(user.email, user.accountId, user.zoneId),
    {
      parse_mode: 'Markdown',
      reply_markup: Keyboards.mainMenu().reply_markup
    }
  );
}

async function requireAuth(ctx, next) {
  const userId = ctx.from.id;
  const isLoggedIn = await db.isUserLoggedIn(userId);
  
  if (!isLoggedIn) {
    await ctx.answerCbQuery('❌ Anda belum login! Gunakan /start untuk memulai.');
    return;
  }
  
  return next();
}

module.exports = {
  handleAuthFlow,
  handleBackToMenu,
  requireAuth
};