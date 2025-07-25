const simpleGit = require('simple-git');
const fs = require('fs-extra');
const path = require('path');
const config = require('./config');

class GitService {
  constructor() {
    this.tempDir = config.TEMP_DIR;
  }

  async ensureTempDir() {
    await fs.ensureDir(this.tempDir);
  }

  async cloneRepository(repoUrl, userId) {
    try {
      await this.ensureTempDir();
      
      // Create unique directory for this user's clone
      const cloneDir = path.join(this.tempDir, `repo_${userId}_${Date.now()}`);
      
      // Initialize git
      const git = simpleGit();
      
      // Clone repository
      await git.clone(repoUrl, cloneDir);
      
      return {
        success: true,
        cloneDir: cloneDir
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to clone repository: ${error.message}`
      };
    }
  }

  async readFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return {
        success: true,
        content: content
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to read file: ${error.message}`
      };
    }
  }

  async checkWranglerConfig(cloneDir) {
    try {
      const wranglerPath = path.join(cloneDir, 'wrangler.toml');
      const exists = await fs.pathExists(wranglerPath);
      
      if (exists) {
        const content = await fs.readFile(wranglerPath, 'utf8');
        return {
          exists: true,
          content: content,
          path: wranglerPath
        };
      }
      
      return { exists: false };
    } catch (error) {
      return {
        exists: false,
        error: error.message
      };
    }
  }

  async findMainScript(cloneDir) {
    try {
      // Common entry point files
      const possibleFiles = [
        'index.js',
        'worker.js',
        'src/index.js',
        'src/worker.js',
        'main.js',
        'app.js'
      ];
      
      for (const file of possibleFiles) {
        const filePath = path.join(cloneDir, file);
        if (await fs.pathExists(filePath)) {
          const content = await fs.readFile(filePath, 'utf8');
          return {
            success: true,
            path: filePath,
            content: content,
            relativePath: file
          };
        }
      }
      
      return {
        success: false,
        error: 'No main script file found. Please ensure your repository has index.js, worker.js, or similar entry point.'
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to find main script: ${error.message}`
      };
    }
  }

  async listFiles(cloneDir, extension = '.js') {
    try {
      const files = [];
      
      const scanDir = async (dir, relativePath = '') => {
        const items = await fs.readdir(dir);
        
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const itemRelativePath = path.join(relativePath, item);
          const stat = await fs.stat(fullPath);
          
          if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            await scanDir(fullPath, itemRelativePath);
          } else if (stat.isFile() && item.endsWith(extension)) {
            files.push({
              name: item,
              path: fullPath,
              relativePath: itemRelativePath
            });
          }
        }
      };
      
      await scanDir(cloneDir);
      
      return {
        success: true,
        files: files
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to list files: ${error.message}`
      };
    }
  }

  async cleanup(cloneDir) {
    try {
      if (await fs.pathExists(cloneDir)) {
        await fs.remove(cloneDir);
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to cleanup: ${error.message}`
      };
    }
  }

  async cleanupAll() {
    try {
      if (await fs.pathExists(this.tempDir)) {
        const items = await fs.readdir(this.tempDir);
        
        for (const item of items) {
          if (item.startsWith('repo_')) {
            const itemPath = path.join(this.tempDir, item);
            await fs.remove(itemPath);
          }
        }
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to cleanup all: ${error.message}`
      };
    }
  }
}

module.exports = new GitService();