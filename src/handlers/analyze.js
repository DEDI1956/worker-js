const wranglerAnalyzer = require('./wrangler-analyzer');
const keyboards = require('../keyboards');
const db = require('../database');

/**
 * Handle analyze repository command
 */
async function handleAnalyzeRepo(ctx) {
  const userId = ctx.from.id;
  
  try {
    await ctx.editMessageText(
      '🔍 **Analisis Repository GitHub**\n\n' +
      'Fitur ini akan:\n' +
      '• ✅ Cek apakah ada file `wrangler.toml`\n' +
      '• 🔍 Analisis format Worker (modules/service-worker)\n' +
      '• 🔧 Deteksi kebutuhan Node.js compatibility\n' +
      '• 📝 Generate/update `wrangler.toml` otomatis\n\n' +
      '📎 Silakan kirim URL repository GitHub:',
      {
        reply_markup: {
          inline_keyboard: [[{ text: '🔙 Kembali ke Menu', callback_data: 'back_to_menu' }]]
        },
        parse_mode: 'Markdown'
      }
    );

    // Set user step to await repository URL
    await db.updateUserStep(userId, 'awaiting_repo_analysis', { action: 'analyze_repo' });

  } catch (error) {
    console.error('Error in handleAnalyzeRepo:', error);
    await ctx.reply('❌ Terjadi kesalahan. Silakan coba lagi.');
  }
}

/**
 * Handle the analyze flow when user sends repository URL
 */
async function handleAnalyzeFlow(ctx) {
  const userId = ctx.from.id;
  const user = await db.getUser(userId);
  
  if (!user || !user.stepData || user.stepData.action !== 'analyze_repo') {
    return ctx.reply('❌ Sesi tidak valid. Silakan mulai ulang dengan /start');
  }

  const repoUrl = ctx.message.text.trim();
  
  // Validate GitHub URL
  if (!isValidGitHubUrl(repoUrl)) {
    return ctx.reply(
      '❌ URL tidak valid!\n\n' +
      '✅ Contoh URL yang benar:\n' +
      '• `https://github.com/username/repo`\n' +
      '• `https://github.com/username/repo.git`\n\n' +
      '📎 Silakan kirim URL repository GitHub yang valid:',
      { parse_mode: 'Markdown' }
    );
  }

  // Clear user step
  await db.updateUserStep(userId, null, null);

  // Show processing message
  const processingMsg = await ctx.reply(
    '🔄 **Menganalisis repository...**\n\n' +
    '⏳ Sedang melakukan:\n' +
    '• 📥 Clone repository\n' +
    '• 🔍 Scan file Worker\n' +
    '• 🔧 Analisis format & compatibility\n' +
    '• 📝 Generate konfigurasi optimal\n\n' +
    '⏱️ Mohon tunggu sebentar...',
    { parse_mode: 'Markdown' }
  );

  try {
    // Perform repository analysis
    const result = await wranglerAnalyzer.analyzeRepository(repoUrl, userId);
    
    if (!result.success) {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        processingMsg.message_id,
        undefined,
        `❌ **Analisis Gagal**\n\n` +
        `🔴 Error: ${result.error}\n\n` +
        `💡 Pastikan:\n` +
        `• Repository bersifat public\n` +
        `• URL GitHub valid\n` +
        `• Repository berisi file JavaScript`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔄 Coba Lagi', callback_data: 'analyze_repo' }],
              [{ text: '🏠 Menu Utama', callback_data: 'back_to_menu' }]
            ]
          }
        }
      );
      return;
    }

    // Format and display results
    const analysisText = wranglerAnalyzer.formatAnalysisResults(result.analysis);
    
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      processingMsg.message_id,
      undefined,
      analysisText,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📋 Lihat Konfigurasi', callback_data: `show_config_${userId}_${Date.now()}` }],
            [{ text: '🔄 Analisis Lagi', callback_data: 'analyze_repo' }],
            [{ text: '🏠 Menu Utama', callback_data: 'back_to_menu' }]
          ]
        }
      }
    );

    // Store the generated config for display
    await db.storeTemporaryData(userId, 'last_analysis', result.analysis);

  } catch (error) {
    console.error('Error in repository analysis:', error);
    
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      processingMsg.message_id,
      undefined,
      '❌ **Terjadi kesalahan sistem**\n\n' +
      '🔴 Gagal menganalisis repository.\n' +
      '⏱️ Silakan coba lagi dalam beberapa saat.',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔄 Coba Lagi', callback_data: 'analyze_repo' }],
            [{ text: '🏠 Menu Utama', callback_data: 'back_to_menu' }]
          ]
        }
      }
    );
  }
}

/**
 * Show generated wrangler.toml configuration
 */
async function handleShowConfig(ctx) {
  const userId = ctx.from.id;
  
  try {
    const analysis = await db.getTemporaryData(userId, 'last_analysis');
    
    if (!analysis || !analysis.generatedConfig) {
      return ctx.answerCbQuery('❌ Konfigurasi tidak ditemukan. Silakan analisis repository terlebih dahulu.');
    }

    const configText = `📝 **Generated wrangler.toml:**\n\n` +
                      `\`\`\`toml\n${analysis.generatedConfig}\n\`\`\`\n\n` +
                      `💡 **Tips:**\n` +
                      `• Copy konfigurasi di atas\n` +
                      `• Simpan sebagai \`wrangler.toml\` di root repository\n` +
                      `• Sesuaikan environment variables jika diperlukan`;

    await ctx.editMessageText(configText, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔙 Kembali ke Hasil', callback_data: 'back_to_analysis' }],
          [{ text: '🏠 Menu Utama', callback_data: 'back_to_menu' }]
        ]
      }
    });

  } catch (error) {
    console.error('Error showing config:', error);
    await ctx.answerCbQuery('❌ Terjadi kesalahan saat menampilkan konfigurasi.');
  }
}

/**
 * Go back to analysis results
 */
async function handleBackToAnalysis(ctx) {
  const userId = ctx.from.id;
  
  try {
    const analysis = await db.getTemporaryData(userId, 'last_analysis');
    
    if (!analysis) {
      return ctx.answerCbQuery('❌ Data analisis tidak ditemukan.');
    }

    const analysisText = wranglerAnalyzer.formatAnalysisResults(analysis);
    
    await ctx.editMessageText(analysisText, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📋 Lihat Konfigurasi', callback_data: `show_config_${userId}_${Date.now()}` }],
          [{ text: '🔄 Analisis Lagi', callback_data: 'analyze_repo' }],
          [{ text: '🏠 Menu Utama', callback_data: 'back_to_menu' }]
        ]
      }
    });

  } catch (error) {
    console.error('Error going back to analysis:', error);
    await ctx.answerCbQuery('❌ Terjadi kesalahan.');
  }
}

/**
 * Validate GitHub repository URL
 */
function isValidGitHubUrl(url) {
  const githubPattern = /^https:\/\/github\.com\/[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+(\.git)?$/;
  return githubPattern.test(url);
}

module.exports = {
  handleAnalyzeRepo,
  handleAnalyzeFlow,
  handleShowConfig,
  handleBackToAnalysis
};