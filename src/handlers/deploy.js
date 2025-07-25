const config = require('../config');
const db = require('../database');
const cloudflare = require('../cloudflare');
const git = require('../git');
const Keyboards = require('../keyboards');

async function handleDeployGit(ctx) {
  const userId = ctx.from.id;
  
  // Update user step to request worker name
  await db.updateUserStep(userId, 'awaiting_worker_name', { action: 'deploy_git' });
  
  await ctx.editMessageText(
    '🚀 *Deploy dari GitHub Repository*\n\n' +
    '📝 *Langkah 1: Nama Worker*\n' +
    'Kirim nama untuk worker Anda (hanya huruf, angka, dan tanda hubung).\n\n' +
    '⚠️ *Contoh:* my-worker, api-handler, website-proxy',
    { parse_mode: 'Markdown' }
  );
}

async function handleDeployFlow(ctx) {
  const userId = ctx.from.id;
  const user = await db.getUser(userId);
  
  if (!user || !user.currentStep) {
    return;
  }
  
  const messageText = ctx.message.text;
  
  switch (user.currentStep) {
    case 'awaiting_worker_name':
      if (user.stepData?.action === 'deploy_git') {
        await handleWorkerName(ctx, messageText);
      }
      break;
      
    case 'awaiting_repo_url':
      await handleRepoUrl(ctx, messageText);
      break;
  }
}

async function handleWorkerName(ctx, workerName) {
  const userId = ctx.from.id;
  
  // Validate worker name
  const nameRegex = /^[a-z0-9-]{1,63}$/;
  if (!nameRegex.test(workerName)) {
    await ctx.reply(
      '❌ *Nama worker tidak valid!*\n\n' +
      '*Aturan nama worker:*\n' +
      '• Hanya huruf kecil, angka, dan tanda hubung (-)\n' +
      '• Maksimal 63 karakter\n' +
      '• Tidak boleh diawali atau diakhiri dengan tanda hubung\n\n' +
      'Silakan kirim nama yang benar.',
      { parse_mode: 'Markdown' }
    );
    return;
  }
  
  // Save worker name and update step
  await db.updateUserStep(userId, 'awaiting_repo_url', { 
    action: 'deploy_git', 
    workerName: workerName.trim().toLowerCase()
  });
  
  await ctx.reply(
    `✅ *Nama worker:* ${workerName}\n\n` +
    '📝 *Langkah 2: GitHub Repository*\n' +
    'Kirim link lengkap repository GitHub Anda.\n\n' +
    '⚠️ *Contoh:*\n' +
    '• https://github.com/username/repo-name\n' +
    '• https://github.com/username/repo-name.git\n\n' +
    '📋 *Repository harus berisi:*\n' +
    '• File JavaScript worker (index.js, worker.js, dll)\n' +
    '• Opsional: wrangler.toml untuk konfigurasi',
    { parse_mode: 'Markdown' }
  );
}

async function handleRepoUrl(ctx, repoUrl) {
  const userId = ctx.from.id;
  const user = await db.getUser(userId);
  
  // Validate GitHub URL
  const githubRegex = /^https:\/\/github\.com\/[\w\-\.]+\/[\w\-\.]+(?:\.git)?(?:\/)?$/;
  if (!githubRegex.test(repoUrl)) {
    await ctx.reply(
      '❌ *URL repository tidak valid!*\n\n' +
      'Pastikan URL adalah repository GitHub yang valid.\n\n' +
      '*Contoh yang benar:*\n' +
      '• https://github.com/username/repo-name\n' +
      '• https://github.com/username/repo-name.git',
      { parse_mode: 'Markdown' }
    );
    return;
  }
  
  const workerName = user.stepData.workerName;
  
  // Show processing message
  const processingMsg = await ctx.reply(
    '🔄 *Memproses deployment...*\n\n' +
    '📥 Cloning repository...',
    { parse_mode: 'Markdown' }
  );
  
  try {
    // Clone repository
    const cloneResult = await git.cloneRepository(repoUrl, userId);
    
    if (!cloneResult.success) {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        processingMsg.message_id,
        null,
        `❌ *Gagal clone repository!*\n\n*Error:* ${cloneResult.error}`,
        { parse_mode: 'Markdown' }
      );
      await db.clearUserStep(userId);
      return;
    }
    
    // Update processing message
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      processingMsg.message_id,
      null,
      '🔄 *Memproses deployment...*\n\n' +
      '✅ Repository cloned\n' +
      '🔍 Mencari file konfigurasi...',
      { parse_mode: 'Markdown' }
    );
    
    // Check for wrangler.toml
    const wranglerConfig = await git.checkWranglerConfig(cloneResult.cloneDir);
    
    let scriptContent;
    
    if (wranglerConfig.exists) {
      // Update processing message
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        processingMsg.message_id,
        null,
        '🔄 *Memproses deployment...*\n\n' +
        '✅ Repository cloned\n' +
        '✅ Wrangler config found\n' +
        '📄 Membaca script...',
        { parse_mode: 'Markdown' }
      );
      
      // Find main script based on wrangler.toml
      const mainScript = await git.findMainScript(cloneResult.cloneDir);
      
      if (!mainScript.success) {
        await ctx.telegram.editMessageText(
          ctx.chat.id,
          processingMsg.message_id,
          null,
          `❌ *Gagal menemukan file script utama!*\n\n*Error:* ${mainScript.error}`,
          { parse_mode: 'Markdown' }
        );
        await git.cleanup(cloneResult.cloneDir);
        await db.clearUserStep(userId);
        return;
      }
      
      scriptContent = mainScript.content;
    } else {
      // No wrangler.toml, find main script manually
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        processingMsg.message_id,
        null,
        '🔄 *Memproses deployment...*\n\n' +
        '✅ Repository cloned\n' +
        '⚠️ No wrangler.toml found\n' +
        '🔍 Mencari script utama...',
        { parse_mode: 'Markdown' }
      );
      
      const mainScript = await git.findMainScript(cloneResult.cloneDir);
      
      if (!mainScript.success) {
        await ctx.telegram.editMessageText(
          ctx.chat.id,
          processingMsg.message_id,
          null,
          `❌ *Gagal menemukan file script utama!*\n\n*Error:* ${mainScript.error}`,
          { parse_mode: 'Markdown' }
        );
        await git.cleanup(cloneResult.cloneDir);
        await db.clearUserStep(userId);
        return;
      }
      
      scriptContent = mainScript.content;
    }
    
    // Update processing message
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      processingMsg.message_id,
      null,
      '🔄 *Memproses deployment...*\n\n' +
      '✅ Repository cloned\n' +
      '✅ Script loaded\n' +
      '🚀 Deploying to Cloudflare...',
      { parse_mode: 'Markdown' }
    );
    
    // Get user credentials
    const credentials = await db.getUserCredentials(userId);
    
    // Deploy to Cloudflare
    const deployResult = await cloudflare.deployWorker(
      credentials.apiToken,
      credentials.accountId,
      workerName,
      scriptContent
    );
    
    // Cleanup
    await git.cleanup(cloneResult.cloneDir);
    await db.clearUserStep(userId);
    
    if (deployResult.success) {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        processingMsg.message_id,
        null,
        config.MESSAGES.DEPLOY_SUCCESS(workerName, deployResult.url),
        {
          parse_mode: 'Markdown',
          reply_markup: Keyboards.backToMenu().reply_markup
        }
      );
    } else {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        processingMsg.message_id,
        null,
        `❌ *Deploy gagal!*\n\n*Error:* ${deployResult.error}`,
        {
          parse_mode: 'Markdown',
          reply_markup: Keyboards.backToMenu().reply_markup
        }
      );
    }
    
  } catch (error) {
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      processingMsg.message_id,
      null,
      `❌ *Terjadi kesalahan!*\n\n*Error:* ${error.message}`,
      {
        parse_mode: 'Markdown',
        reply_markup: Keyboards.backToMenu().reply_markup
      }
    );
    await db.clearUserStep(userId);
  }
}

module.exports = {
  handleDeployGit,
  handleDeployFlow
};