const config = require('../config');
const db = require('../database');
const cloudflare = require('../cloudflare');
const Keyboards = require('../keyboards');

async function handleUploadJS(ctx) {
  const userId = ctx.from.id;
  
  // Update user step to request worker name
  await db.updateUserStep(userId, 'awaiting_worker_name', { action: 'upload_js' });
  
  await ctx.editMessageText(
    '📂 *Upload File JavaScript*\n\n' +
    '📝 *Langkah 1: Nama Worker*\n' +
    'Kirim nama untuk worker Anda (hanya huruf, angka, dan tanda hubung).\n\n' +
    '⚠️ *Contoh:* my-worker, api-handler, website-proxy',
    { parse_mode: 'Markdown' }
  );
}

async function handleUploadFlow(ctx) {
  const userId = ctx.from.id;
  const user = await db.getUser(userId);
  
  if (!user || !user.currentStep) {
    return;
  }
  
  // Handle text messages
  if (ctx.message && ctx.message.text) {
    const messageText = ctx.message.text;
    
    switch (user.currentStep) {
      case 'awaiting_worker_name':
        if (user.stepData?.action === 'upload_js') {
          await handleUploadWorkerName(ctx, messageText);
        }
        break;
        
      case 'awaiting_js_code':
        await handleJSCode(ctx, messageText);
        break;
    }
  }
  
  // Handle document uploads
  if (ctx.message && ctx.message.document) {
    if (user.currentStep === 'awaiting_js_file') {
      await handleJSFile(ctx);
    }
  }
}

async function handleUploadWorkerName(ctx, workerName) {
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
  await db.updateUserStep(userId, 'awaiting_js_file', { 
    action: 'upload_js', 
    workerName: workerName.trim().toLowerCase()
  });
  
  await ctx.reply(
    `✅ *Nama worker:* ${workerName}\n\n` +
    '📝 *Langkah 2: Kode JavaScript*\n' +
    'Pilih salah satu cara:\n\n' +
    '📎 *Upload File:* Kirim file .js sebagai document\n' +
    '📝 *Paste Kode:* Ketik atau paste kode JavaScript langsung\n\n' +
    '⚠️ *Contoh kode worker sederhana:*\n' +
    '```javascript\n' +
    'addEventListener("fetch", event => {\n' +
    '  event.respondWith(handleRequest(event.request))\n' +
    '})\n\n' +
    'async function handleRequest(request) {\n' +
    '  return new Response("Hello World!")\n' +
    '}\n' +
    '```',
    { 
      parse_mode: 'Markdown',
      reply_markup: Keyboards.backToMenu().reply_markup
    }
  );
}

async function handleJSFile(ctx) {
  const userId = ctx.from.id;
  const user = await db.getUser(userId);
  const document = ctx.message.document;
  
  // Validate file type
  if (!document.file_name.endsWith('.js')) {
    await ctx.reply(
      '❌ *File tidak valid!*\n\n' +
      'Hanya file dengan ekstensi .js yang diperbolehkan.\n' +
      'Silakan upload file JavaScript yang benar.',
      { parse_mode: 'Markdown' }
    );
    return;
  }
  
  // Check file size (max 1MB)
  if (document.file_size > 1024 * 1024) {
    await ctx.reply(
      '❌ *File terlalu besar!*\n\n' +
      'Ukuran file maksimal adalah 1MB.\n' +
      'Silakan upload file yang lebih kecil.',
      { parse_mode: 'Markdown' }
    );
    return;
  }
  
  const processingMsg = await ctx.reply(
    '🔄 *Memproses file...*\n\n' +
    '📥 Downloading file...',
    { parse_mode: 'Markdown' }
  );
  
  try {
    // Get file from Telegram
    const file = await ctx.telegram.getFile(document.file_id);
    const fileUrl = `https://api.telegram.org/file/bot${config.BOT_TOKEN}/${file.file_path}`;
    
    // Download file content
    const axios = require('axios');
    const response = await axios.get(fileUrl);
    const scriptContent = response.data;
    
    // Validate JavaScript content
    if (!isValidJavaScript(scriptContent)) {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        processingMsg.message_id,
        null,
        '❌ *File JavaScript tidak valid!*\n\n' +
        'Pastikan file berisi kode JavaScript yang benar.',
        { parse_mode: 'Markdown' }
      );
      return;
    }
    
    // Update processing message
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      processingMsg.message_id,
      null,
      '🔄 *Memproses deployment...*\n\n' +
      '✅ File downloaded\n' +
      '✅ JavaScript validated\n' +
      '🚀 Deploying to Cloudflare...',
      { parse_mode: 'Markdown' }
    );
    
    // Deploy to Cloudflare
    await deployScript(ctx, processingMsg.message_id, user.stepData.workerName, scriptContent);
    
  } catch (error) {
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      processingMsg.message_id,
      null,
      `❌ *Gagal memproses file!*\n\n*Error:* ${error.message}`,
      {
        parse_mode: 'Markdown',
        reply_markup: Keyboards.backToMenu().reply_markup
      }
    );
    await db.clearUserStep(userId);
  }
}

async function handleJSCode(ctx, code) {
  const userId = ctx.from.id;
  const user = await db.getUser(userId);
  
  // Validate JavaScript content
  if (!isValidJavaScript(code)) {
    await ctx.reply(
      '❌ *Kode JavaScript tidak valid!*\n\n' +
      'Pastikan kode yang Anda kirim adalah JavaScript yang benar.\n\n' +
      '*Tips:*\n' +
      '• Periksa syntax JavaScript\n' +
      '• Pastikan ada event listener atau handler\n' +
      '• Gunakan format Cloudflare Worker',
      { parse_mode: 'Markdown' }
    );
    return;
  }
  
  const processingMsg = await ctx.reply(
    '🔄 *Memproses deployment...*\n\n' +
    '✅ Kode validated\n' +
    '🚀 Deploying to Cloudflare...',
    { parse_mode: 'Markdown' }
  );
  
  // Deploy to Cloudflare
  await deployScript(ctx, processingMsg.message_id, user.stepData.workerName, code);
}

async function deployScript(ctx, messageId, workerName, scriptContent) {
  const userId = ctx.from.id;
  
  try {
    // Get user credentials
    const credentials = await db.getUserCredentials(userId);
    
    // Deploy to Cloudflare
    const deployResult = await cloudflare.deployWorker(
      credentials.apiToken,
      credentials.accountId,
      workerName,
      scriptContent
    );
    
    // Clear user step
    await db.clearUserStep(userId);
    
    if (deployResult.success) {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        messageId,
        null,
        config.MESSAGES.UPLOAD_SUCCESS(workerName, deployResult.url),
        {
          parse_mode: 'Markdown',
          reply_markup: Keyboards.backToMenu().reply_markup
        }
      );
    } else {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        messageId,
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
      messageId,
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

function isValidJavaScript(code) {
  try {
    // Basic validation
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return false;
    }
    
    // Check for common Cloudflare Worker patterns
    const hasEventListener = code.includes('addEventListener') || 
                           code.includes('fetch') || 
                           code.includes('Request') || 
                           code.includes('Response');
    
    // Check for basic JavaScript syntax
    const hasFunction = code.includes('function') || code.includes('=>');
    
    // Very basic syntax check (this is not comprehensive but catches obvious errors)
    const openBraces = (code.match(/\{/g) || []).length;
    const closeBraces = (code.match(/\}/g) || []).length;
    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    
    const balancedBraces = openBraces === closeBraces;
    const balancedParens = openParens === closeParens;
    
    return hasEventListener && hasFunction && balancedBraces && balancedParens;
  } catch (error) {
    return false;
  }
}

module.exports = {
  handleUploadJS,
  handleUploadFlow
};