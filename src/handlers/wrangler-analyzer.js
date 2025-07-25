const gitService = require('../git');
const fs = require('fs-extra');
const path = require('path');

class WranglerAnalyzer {
  
  /**
   * Analyze repository and generate/update wrangler.toml
   */
  async analyzeRepository(repoUrl, userId) {
    try {
      // Step 1: Clone repository
      const cloneResult = await gitService.cloneRepository(repoUrl, userId);
      if (!cloneResult.success) {
        return {
          success: false,
          error: cloneResult.error
        };
      }

      const cloneDir = cloneResult.cloneDir;
      let analysis = {
        repoUrl,
        cloneDir,
        hasWranglerToml: false,
        workerFiles: [],
        format: 'modules', // default
        needsNodeCompat: false,
        mainFile: 'worker.js',
        workerName: this.extractWorkerNameFromRepo(repoUrl),
        compatibilityDate: new Date().toISOString().split('T')[0]
      };

      try {
        // Step 2: Check if wrangler.toml exists
        const wranglerPath = path.join(cloneDir, 'wrangler.toml');
        analysis.hasWranglerToml = await fs.pathExists(wranglerPath);
        
        if (analysis.hasWranglerToml) {
          const existingConfig = await fs.readFile(wranglerPath, 'utf8');
          analysis.existingConfig = existingConfig;
        }

        // Step 3: Find and analyze Worker files
        const workerAnalysis = await this.analyzeWorkerFiles(cloneDir);
        analysis = { ...analysis, ...workerAnalysis };

        // Step 4: Generate optimal wrangler.toml
        const wranglerConfig = this.generateWranglerConfig(analysis);
        analysis.generatedConfig = wranglerConfig;

        // Step 5: Write the configuration
        await fs.writeFile(wranglerPath, wranglerConfig, 'utf8');
        analysis.configWritten = true;

        return {
          success: true,
          analysis
        };

      } finally {
        // Always cleanup
        await gitService.cleanup(cloneDir);
      }

    } catch (error) {
      return {
        success: false,
        error: `Analysis failed: ${error.message}`
      };
    }
  }

  /**
   * Analyze Worker files to determine format and compatibility needs
   */
  async analyzeWorkerFiles(cloneDir) {
    const analysis = {
      workerFiles: [],
      format: 'modules',
      needsNodeCompat: false,
      mainFile: 'worker.js'
    };

    // Common Worker file patterns
    const patterns = [
      'index.js',
      'worker.js', 
      'src/index.js',
      'src/worker.js',
      'main.js',
      'app.js',
      'server.js'
    ];

    // Find all potential Worker files
    for (const pattern of patterns) {
      const filePath = path.join(cloneDir, pattern);
      if (await fs.pathExists(filePath)) {
        const content = await fs.readFile(filePath, 'utf8');
        const fileAnalysis = this.analyzeWorkerContent(content);
        
        analysis.workerFiles.push({
          path: pattern,
          fullPath: filePath,
          ...fileAnalysis
        });
      }
    }

    // Also scan for any .js files in root and src
    await this.scanForJSFiles(cloneDir, analysis);

    // Determine overall format and compatibility
    if (analysis.workerFiles.length > 0) {
      // Use the first/main worker file for analysis
      const mainWorker = analysis.workerFiles[0];
      analysis.format = mainWorker.format;
      analysis.needsNodeCompat = mainWorker.needsNodeCompat;
      analysis.mainFile = mainWorker.path;
    }

    // Check if any file needs Node.js compatibility
    analysis.needsNodeCompat = analysis.workerFiles.some(file => file.needsNodeCompat);

    return analysis;
  }

  /**
   * Analyze individual Worker file content
   */
  analyzeWorkerContent(content) {
    const analysis = {
      format: 'modules',
      needsNodeCompat: false,
      hasExportDefault: false,
      hasAddEventListener: false,
      hasImports: false,
      hasNodeImports: false
    };

    // Check for ES modules patterns
    analysis.hasExportDefault = /export\s+default/.test(content);
    analysis.hasImports = /import\s+.*\s+from/.test(content);
    
    // Check for service-worker pattern
    analysis.hasAddEventListener = /addEventListener\s*\(\s*['"`]fetch['"`]/.test(content);
    
    // Check for Node.js compatibility needs
    analysis.hasNodeImports = /import\s+.*\s+from\s+['"`]node:/.test(content) || 
                             /require\s*\(\s*['"`]node:/.test(content);
    
    // Determine format
    if (analysis.hasAddEventListener && !analysis.hasExportDefault) {
      analysis.format = 'service-worker';
    } else if (analysis.hasExportDefault || analysis.hasImports) {
      analysis.format = 'modules';
    }

    // Determine Node.js compatibility needs
    analysis.needsNodeCompat = analysis.hasNodeImports || 
                              /require\s*\(\s*['"`](fs|path|crypto|buffer|stream|util)['"`]/.test(content) ||
                              /process\.env/.test(content) ||
                              /__dirname|__filename/.test(content);

    return analysis;
  }

  /**
   * Scan for additional JS files
   */
  async scanForJSFiles(cloneDir, analysis) {
    const scanDirs = ['', 'src'];
    
    for (const dir of scanDirs) {
      const scanPath = path.join(cloneDir, dir);
      if (await fs.pathExists(scanPath)) {
        try {
          const files = await fs.readdir(scanPath);
          for (const file of files) {
            if (file.endsWith('.js') && !analysis.workerFiles.some(w => w.path.endsWith(file))) {
              const filePath = path.join(scanPath, file);
              const content = await fs.readFile(filePath, 'utf8');
              const fileAnalysis = this.analyzeWorkerContent(content);
              
              analysis.workerFiles.push({
                path: path.join(dir, file).replace(/^\//, ''),
                fullPath: filePath,
                ...fileAnalysis
              });
            }
          }
        } catch (error) {
          // Ignore scan errors
        }
      }
    }
  }

  /**
   * Generate optimal wrangler.toml configuration
   */
  generateWranglerConfig(analysis) {
    const config = [];
    
    // Basic configuration
    config.push(`name = "${analysis.workerName}"`);
    config.push(`main = "${analysis.mainFile}"`);
    config.push(`compatibility_date = "${analysis.compatibilityDate}"`);
    config.push('');

    // Build configuration
    config.push('[build.upload]');
    config.push(`format = "${analysis.format}"`);
    config.push('');

    // Node.js compatibility if needed
    if (analysis.needsNodeCompat) {
      config.push('compatibility_flags = ["nodejs_compat_v2"]');
      config.push('');
    }

    // Add helpful comments and optional sections
    config.push('# Environment variables (uncomment and modify as needed)');
    config.push('# [vars]');
    config.push('# API_KEY = "your-api-key"');
    config.push('# ENVIRONMENT = "production"');
    config.push('');

    config.push('# KV Namespaces (uncomment and add your KV namespace ID)');
    config.push('# [[kv_namespaces]]');
    config.push('# binding = "MY_KV"');
    config.push('# id = "your-kv-namespace-id"');
    config.push('');

    config.push('# Durable Objects (uncomment if using Durable Objects)');
    config.push('# [[durable_objects.bindings]]');
    config.push('# name = "MY_DURABLE_OBJECT"');
    config.push('# class_name = "MyDurableObject"');
    config.push('');

    config.push('# R2 Buckets (uncomment if using R2 storage)');
    config.push('# [[r2_buckets]]');
    config.push('# binding = "MY_BUCKET"');
    config.push('# bucket_name = "my-bucket"');

    return config.join('\n');
  }

  /**
   * Extract worker name from repository URL
   */
  extractWorkerNameFromRepo(repoUrl) {
    try {
      // Extract repo name from URL
      const match = repoUrl.match(/\/([^\/]+?)(?:\.git)?$/);
      if (match) {
        return match[1].toLowerCase().replace(/[^a-z0-9-]/g, '-');
      }
    } catch (error) {
      // Fallback
    }
    return 'my-worker';
  }

  /**
   * Format analysis results for display
   */
  formatAnalysisResults(analysis) {
    const results = [];
    
    results.push('🔍 **Analisis Repository:**');
    results.push('');
    
    // Repository info
    results.push(`📦 **Repository:** ${analysis.repoUrl}`);
    results.push(`📝 **Worker Name:** ${analysis.workerName}`);
    results.push(`📄 **Main File:** ${analysis.mainFile}`);
    results.push('');
    
    // wrangler.toml status
    if (analysis.hasWranglerToml) {
      results.push('✅ **wrangler.toml:** Sudah ada (akan diupdate)');
    } else {
      results.push('➕ **wrangler.toml:** Dibuat otomatis');
    }
    results.push('');
    
    // Worker analysis
    results.push('⚙️ **Konfigurasi Worker:**');
    results.push(`• Format: \`${analysis.format}\``);
    results.push(`• Node.js Compatibility: ${analysis.needsNodeCompat ? '✅ Diaktifkan' : '❌ Tidak perlu'}`);
    results.push(`• Tanggal Compatibility: \`${analysis.compatibilityDate}\``);
    results.push('');
    
    // Files found
    if (analysis.workerFiles.length > 0) {
      results.push('📁 **File Worker ditemukan:**');
      analysis.workerFiles.forEach(file => {
        const indicators = [];
        if (file.hasExportDefault) indicators.push('ES modules');
        if (file.hasAddEventListener) indicators.push('Service Worker');
        if (file.needsNodeCompat) indicators.push('Node.js');
        
        results.push(`• \`${file.path}\` ${indicators.length > 0 ? `(${indicators.join(', ')})` : ''}`);
      });
      results.push('');
    }
    
    results.push('✅ **Konfigurasi berhasil dibuat!**');
    
    return results.join('\n');
  }
}

module.exports = new WranglerAnalyzer();