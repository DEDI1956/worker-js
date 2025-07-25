const { Telegraf } = require('telegraf');
const config = require('./src/config');
const db = require('./src/database');

// Import handlers
const { handleStart, handleAgree } = require('./src/handlers/start');
const { handleAuthFlow, handleBackToMenu, requireAuth } = require('./src/handlers/auth');
const { handleDeployGit, handleDeployFlow } = require('./src/handlers/deploy');
const { handleUploadJS, handleUploadFlow } = require('./src/handlers/upload');
const { handleListWorkers, handleDeleteWorkers, handleDeleteWorker, handleConfirmDelete } = require('./src/handlers/workers');

// Validate required environment variables
if (!config.BOT_TOKEN) {
  console.error('❌ BOT_TOKEN is required! Please set it in .env file');
  process.exit(1);
}

// Initialize bot
const bot = new Telegraf(config.BOT_TOKEN);

// Error handling
bot.catch((err, ctx) => {
  console.error('❌ Bot error:', err);
  ctx.reply('❌ Terjadi kesalahan sistem. Silakan coba lagi nanti.')
    .catch(console.error);
});

// Start command
bot.command('start', handleStart);

// Callback query handlers
bot.action('agree', handleAgree);
bot.action('back_to_menu', requireAuth, handleBackToMenu);

// Main menu actions
bot.action('deploy_git', requireAuth, handleDeployGit);
bot.action('upload_js', requireAuth, handleUploadJS);
bot.action('list_workers', requireAuth, handleListWorkers);
bot.action('delete_workers', requireAuth, handleDeleteWorkers);

// Worker deletion handlers
bot.action(/^delete_worker_(.+)$/, requireAuth, (ctx) => {
  const workerName = ctx.match[1];
  return handleDeleteWorker(ctx, workerName);
});

bot.action(/^confirm_delete_(.+)$/, requireAuth, (ctx) => {
  const workerName = ctx.match[1];
  return handleConfirmDelete(ctx, workerName);
});

// Text message handlers for multi-step flows
bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const user = await db.getUser(userId);
  
  // Handle authentication flow
  if (user && user.currentStep && 
      ['awaiting_api_token', 'awaiting_account_id', 'awaiting_zone_id'].includes(user.currentStep)) {
    return handleAuthFlow(ctx);
  }
  
  // Handle deploy flow
  if (user && user.currentStep && 
      ['awaiting_worker_name', 'awaiting_repo_url'].includes(user.currentStep) &&
      user.stepData?.action === 'deploy_git') {
    return handleDeployFlow(ctx);
  }
  
  // Handle upload flow
  if (user && user.currentStep && 
      ['awaiting_worker_name', 'awaiting_js_code'].includes(user.currentStep) &&
      user.stepData?.action === 'upload_js') {
    return handleUploadFlow(ctx);
  }
  
  // Handle upload flow for text code
  if (user && user.currentStep === 'awaiting_js_file' &&
      user.stepData?.action === 'upload_js') {
    // Update step to handle text code instead of file
    await db.updateUserStep(userId, 'awaiting_js_code', user.stepData);
    return handleUploadFlow(ctx);
  }
  
  // Default response for unhandled text
  const isLoggedIn = await db.isUserLoggedIn(userId);
  if (isLoggedIn) {
    ctx.reply('🤖 Gunakan menu atau perintah /start untuk navigasi.', {
      reply_markup: {
        inline_keyboard: [[{ text: '🏠 Menu Utama', callback_data: 'back_to_menu' }]]
      }
    });
  } else {
    ctx.reply('👋 Gunakan /start untuk memulai.');
  }
});

// Document handler for file uploads
bot.on('document', async (ctx) => {
  const userId = ctx.from.id;
  const user = await db.getUser(userId);
  
  // Handle JavaScript file upload
  if (user && user.currentStep === 'awaiting_js_file' &&
      user.stepData?.action === 'upload_js') {
    return handleUploadFlow(ctx);
  }
  
  // Default response for unhandled documents
  ctx.reply('📎 File diterima, tetapi tidak ada proses aktif yang memerlukan file ini.');
});

// Handle other callback queries
bot.on('callback_query', (ctx) => {
  ctx.answerCbQuery('⚠️ Aksi tidak dikenali.');
});

// Graceful shutdown
process.once('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  bot.stop('SIGTERM');
});

// Start bot
async function startBot() {
  try {
    console.log('🚀 Starting Cloudflare Telegram Bot...');
    
    // Initialize database
    await db.init();
    console.log('✅ Database initialized');
    
    // Start bot
    await bot.launch();
    console.log('✅ Bot started successfully!');
    console.log(`🤖 Bot username: @${bot.botInfo.username}`);
    
    // Enable graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
    
  } catch (error) {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
}

// Start the bot
startBot();