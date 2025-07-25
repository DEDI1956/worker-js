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
        const processedContent = this.processWranglerConfig(content);
        
        // Write back the processed content if it was modified
        if (processedContent !== content) {
          await fs.writeFile(wranglerPath, processedContent, 'utf8');
        }
        
        return {
          exists: true,
          content: processedContent,
          path: wranglerPath
        };
      }
      
      // Create a default wrangler.toml if it doesn't exist
      const defaultConfig = this.createDefaultWranglerConfig();
      await fs.writeFile(wranglerPath, defaultConfig, 'utf8');
      
      return {
        exists: true,
        content: defaultConfig,
        path: wranglerPath,
        created: true
      };
    } catch (error) {
      return {
        exists: false,
        error: error.message
      };
    }
  }

  processWranglerConfig(content) {
    // Check if it already has the modern format requirements
    const hasModulesFormat = content.includes('format = "modules"');
    const hasCompatibilityDate = content.includes('compatibility_date');
    const hasMain = content.includes('main =');
    
    // If it has all modern requirements, return as is
    if (hasModulesFormat && hasCompatibilityDate && hasMain) {
      return content;
    }
    
    let processed = content;
    
    // Add compatibility_date if missing
    if (!hasCompatibilityDate) {
      const today = new Date().toISOString().split('T')[0];
      processed = `compatibility_date = "${today}"\n` + processed;
    }
    
    // Add modules format if missing
    if (!hasModulesFormat) {
      processed += '\n[build.upload]\nformat = "modules"\n';
    }
    
    // Ensure main points to a valid file
    if (!hasMain) {
      processed = 'main = "worker.js"\n' + processed;
    }
    
    return processed;
  }

  createDefaultWranglerConfig() {
    const today = new Date().toISOString().split('T')[0];
    return `name = "my-worker"
main = "worker.js"
compatibility_date = "${today}"

[build.upload]
format = "modules"

# Environment variables (uncomment and modify as needed)
# [vars]
# API_KEY = "your-api-key"
# ENVIRONMENT = "production"

# KV Namespaces (uncomment and add your KV namespace ID)
# [[kv_namespaces]]
# binding = "MY_KV"
# id = "your-kv-namespace-id"

# Durable Objects (uncomment if using Durable Objects)
# [[durable_objects.bindings]]
# name = "MY_DURABLE_OBJECT"
# class_name = "MyDurableObject"

# R2 Buckets (uncomment if using R2 storage)
# [[r2_buckets]]
# binding = "MY_BUCKET"
# bucket_name = "my-bucket"
`;
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
          const processedContent = this.processWorkerScript(content);
          return {
            success: true,
            path: filePath,
            content: processedContent,
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

  processWorkerScript(content) {
    // Remove BOM if present
    content = content.replace(/^\uFEFF/, '');
    
    // Check if it's already using modern ES modules format
    if (content.includes('export default') && content.includes('async fetch(')) {
      return content;
    }
    
    // Check if it's using the old addEventListener format
    if (content.includes('addEventListener') && content.includes('fetch')) {
      // Try to convert old format to new format
      return this.convertLegacyWorker(content);
    }
    
    // Check if it uses require() or module.exports (Node.js style)
    if (content.includes('require(') || content.includes('module.exports')) {
      // Convert Node.js style to ES modules
      return this.convertNodeJSWorker(content);
    }
    
    // If it's a simple function or script, wrap it in modern format
    if (!content.includes('export') && !content.includes('addEventListener')) {
      return this.wrapInModernFormat(content);
    }
    
    return content;
  }

  convertLegacyWorker(content) {
    // Extract the handleRequest function content
    const handleRequestMatch = content.match(/async function handleRequest\(request\)\s*{([\s\S]*?)^}/m);
    
    if (handleRequestMatch) {
      const functionBody = handleRequestMatch[1];
      return `// Converted from legacy addEventListener format
export default {
  async fetch(request, env, ctx) {${functionBody}
  }
};`;
    }
    
    // Fallback: create a simple response
    return `// Converted from legacy format
export default {
  async fetch(request, env, ctx) {
    return new Response('Hello from Cloudflare Worker!', {
      headers: { 'content-type': 'text/plain' }
    });
  }
};`;
  }

  convertNodeJSWorker(content) {
    // Remove require statements and module.exports
    let converted = content
      .replace(/const\s+\w+\s*=\s*require\([^)]+\);?\s*/g, '')
      .replace(/module\.exports\s*=\s*[^;]+;?\s*/g, '')
      .replace(/exports\.\w+\s*=\s*[^;]+;?\s*/g, '');
    
    // If there's a main function, use it
    const mainFunctionMatch = converted.match(/(?:async\s+)?function\s+(\w+)\s*\([^)]*\)\s*{[\s\S]*?}/);
    
    if (mainFunctionMatch) {
      const functionName = mainFunctionMatch[1];
      return `// Converted from Node.js format
${converted}

export default {
  async fetch(request, env, ctx) {
    try {
      return await ${functionName}(request, env, ctx);
    } catch (error) {
      return new Response('Internal Server Error', { status: 500 });
    }
  }
};`;
    }
    
    // Fallback
    return this.wrapInModernFormat(converted);
  }

  wrapInModernFormat(content) {
    return `// Auto-wrapped in modern Cloudflare Worker format
${content}

export default {
  async fetch(request, env, ctx) {
    return new Response('Hello from Cloudflare Worker!', {
      headers: { 'content-type': 'text/plain' }
    });
  }
};`;
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