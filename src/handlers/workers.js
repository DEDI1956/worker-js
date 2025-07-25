const config = require('../config');
const db = require('../database');
const cloudflare = require('../cloudflare');
const Keyboards = require('../keyboards');

async function handleListWorkers(ctx) {
  const userId = ctx.from.id;
  
  const processingMsg = await ctx.editMessageText(
    '🔄 *Mengambil daftar workers...*',
    { parse_mode: 'Markdown' }
  );
  
  try {
    // Get user credentials
    const credentials = await db.getUserCredentials(userId);
    
    // Get workers list from Cloudflare
    const listResult = await cloudflare.listWorkers(
      credentials.apiToken,
      credentials.accountId
    );
    
    if (!listResult.success) {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        processingMsg.message_id,
        null,
        `❌ *Gagal mengambil daftar workers!*\n\n*Error:* ${listResult.error}`,
        {
          parse_mode: 'Markdown',
          reply_markup: Keyboards.backToMenu().reply_markup
        }
      );
      return;
    }
    
    const workers = listResult.workers;
    
    if (workers.length === 0) {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        processingMsg.message_id,
        null,
        '📜 *Daftar Workers*\n\n' +
        '──────────────\n' +
        '🔍 *Tidak ada workers ditemukan.*\n' +
        '──────────────\n\n' +
        'Gunakan menu Deploy atau Upload untuk membuat worker baru.',
        {
          parse_mode: 'Markdown',
          reply_markup: Keyboards.backToMenu().reply_markup
        }
      );
      return;
    }
    
    // Format workers list
    let message = '📜 *Daftar Workers*\n\n';
    
    workers.forEach((worker, index) => {
      const workerUrl = `https://${worker.id}.${credentials.accountId}.${config.CLOUDFLARE.WORKERS_SUBDOMAIN}`;
      message += '──────────────\n';
      message += `${index + 1}️⃣ *Nama:* ${worker.id}\n`;
      message += `🌐 *Domain:* ${workerUrl}\n`;
      message += `📅 *Modified:* ${formatDate(worker.modified_on)}\n`;
    });
    
    message += '──────────────';
    
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      processingMsg.message_id,
      null,
      message,
      {
        parse_mode: 'Markdown',
        reply_markup: Keyboards.backToMenu().reply_markup
      }
    );
    
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
  }
}

async function handleDeleteWorkers(ctx) {
  const userId = ctx.from.id;
  
  const processingMsg = await ctx.editMessageText(
    '🔄 *Mengambil daftar workers...*',
    { parse_mode: 'Markdown' }
  );
  
  try {
    // Get user credentials
    const credentials = await db.getUserCredentials(userId);
    
    // Get workers list from Cloudflare
    const listResult = await cloudflare.listWorkers(
      credentials.apiToken,
      credentials.accountId
    );
    
    if (!listResult.success) {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        processingMsg.message_id,
        null,
        `❌ *Gagal mengambil daftar workers!*\n\n*Error:* ${listResult.error}`,
        {
          parse_mode: 'Markdown',
          reply_markup: Keyboards.backToMenu().reply_markup
        }
      );
      return;
    }
    
    const workers = listResult.workers;
    
    if (workers.length === 0) {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        processingMsg.message_id,
        null,
        '🗑️ *Hapus Workers*\n\n' +
        '──────────────\n' +
        '🔍 *Tidak ada workers ditemukan.*\n' +
        '──────────────\n\n' +
        'Gunakan menu Deploy atau Upload untuk membuat worker baru.',
        {
          parse_mode: 'Markdown',
          reply_markup: Keyboards.backToMenu().reply_markup
        }
      );
      return;
    }
    
    // Show workers with delete buttons
    let message = '🗑️ *Hapus Workers*\n\n';
    message += 'Pilih worker yang ingin dihapus:\n\n';
    
    workers.forEach((worker, index) => {
      const workerUrl = `https://${worker.id}.${credentials.accountId}.${config.CLOUDFLARE.WORKERS_SUBDOMAIN}`;
      message += '──────────────\n';
      message += `${index + 1}️⃣ *Nama:* ${worker.id}\n`;
      message += `🌐 *Domain:* ${workerUrl}\n`;
    });
    
    message += '──────────────\n\n';
    message += '⚠️ *Perhatian:* Penghapusan tidak dapat dibatalkan!';
    
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      processingMsg.message_id,
      null,
      message,
      {
        parse_mode: 'Markdown',
        reply_markup: Keyboards.workerDeleteButtons(workers).reply_markup
      }
    );
    
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
  }
}

async function handleDeleteWorker(ctx, workerName) {
  const userId = ctx.from.id;
  
  // Show confirmation
  await ctx.editMessageText(
    `🗑️ *Konfirmasi Penghapusan*\n\n` +
    `Apakah Anda yakin ingin menghapus worker:\n` +
    `*${workerName}*\n\n` +
    `⚠️ *Perhatian:*\n` +
    `• Worker akan dihapus permanen\n` +
    `• Domain akan tidak dapat diakses\n` +
    `• Tindakan ini tidak dapat dibatalkan`,
    {
      parse_mode: 'Markdown',
      reply_markup: Keyboards.confirmAction('delete', workerName).reply_markup
    }
  );
}

async function handleConfirmDelete(ctx, workerName) {
  const userId = ctx.from.id;
  
  const processingMsg = await ctx.editMessageText(
    `🔄 *Menghapus worker ${workerName}...*`,
    { parse_mode: 'Markdown' }
  );
  
  try {
    // Get user credentials
    const credentials = await db.getUserCredentials(userId);
    
    // Delete worker from Cloudflare
    const deleteResult = await cloudflare.deleteWorker(
      credentials.apiToken,
      credentials.accountId,
      workerName
    );
    
    if (deleteResult.success) {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        processingMsg.message_id,
        null,
        config.MESSAGES.DELETE_SUCCESS(workerName),
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
        `❌ *Gagal menghapus worker!*\n\n*Error:* ${deleteResult.error}`,
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
  }
}

function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Unknown';
  }
}

module.exports = {
  handleListWorkers,
  handleDeleteWorkers,
  handleDeleteWorker,
  handleConfirmDelete
};