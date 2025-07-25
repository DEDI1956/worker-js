const { Markup } = require('telegraf');

class Keyboards {
  static welcome() {
    return Markup.inlineKeyboard([
      [Markup.button.callback('✅ Saya Setuju', 'agree')]
    ]);
  }

  static mainMenu() {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('🚀 DeployGit', 'deploy_git'),
        Markup.button.callback('📂 UploadJS', 'upload_js')
      ],
      [
        Markup.button.callback('🔍 AnalysisRepo', 'analyze_repo'),
        Markup.button.callback('📜 ListWrk', 'list_workers')
      ],
      [
        Markup.button.callback('🗑️ DelWrk', 'delete_workers')
      ]
    ]);
  }

  static backToMenu() {
    return Markup.inlineKeyboard([
      [Markup.button.callback('🏠 Kembali ke Menu', 'back_to_menu')]
    ]);
  }

  static confirmAction(action, data) {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('✅ Ya', `confirm_${action}_${data}`),
        Markup.button.callback('❌ Batal', 'back_to_menu')
      ]
    ]);
  }

  static workerDeleteButtons(workers) {
    const buttons = [];
    
    workers.forEach((worker, index) => {
      if (index % 2 === 0) {
        buttons.push([]);
      }
      
      const buttonText = `❌ ${worker.id}`;
      const callbackData = `delete_worker_${worker.id}`;
      
      buttons[buttons.length - 1].push(
        Markup.button.callback(buttonText, callbackData)
      );
    });
    
    // Add back button
    buttons.push([Markup.button.callback('🏠 Kembali ke Menu', 'back_to_menu')]);
    
    return Markup.inlineKeyboard(buttons);
  }

  static fileSelection(files) {
    const buttons = [];
    
    files.forEach((file, index) => {
      buttons.push([
        Markup.button.callback(
          `📄 ${file.relativePath}`, 
          `select_file_${index}`
        )
      ]);
    });
    
    // Add back button
    buttons.push([Markup.button.callback('🏠 Kembali ke Menu', 'back_to_menu')]);
    
    return Markup.inlineKeyboard(buttons);
  }

  static deployOptions() {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('🚀 Deploy Sekarang', 'deploy_now'),
        Markup.button.callback('⚙️ Konfigurasi Manual', 'manual_config')
      ],
      [Markup.button.callback('🏠 Kembali ke Menu', 'back_to_menu')]
    ]);
  }

  static pagination(currentPage, totalPages, prefix) {
    const buttons = [];
    
    if (totalPages > 1) {
      const pageButtons = [];
      
      if (currentPage > 1) {
        pageButtons.push(Markup.button.callback('◀️', `${prefix}_page_${currentPage - 1}`));
      }
      
      pageButtons.push(Markup.button.callback(`${currentPage}/${totalPages}`, 'current_page'));
      
      if (currentPage < totalPages) {
        pageButtons.push(Markup.button.callback('▶️', `${prefix}_page_${currentPage + 1}`));
      }
      
      buttons.push(pageButtons);
    }
    
    buttons.push([Markup.button.callback('🏠 Kembali ke Menu', 'back_to_menu')]);
    
    return Markup.inlineKeyboard(buttons);
  }
}

module.exports = Keyboards;