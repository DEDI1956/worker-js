const axios = require('axios');
const config = require('./config');

class CloudflareService {
  constructor() {
    this.apiBase = config.CLOUDFLARE.API_BASE;
  }

  createHeaders(apiToken) {
    return {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json'
    };
  }

  async validateToken(apiToken) {
    try {
      const response = await axios.get(`${this.apiBase}/user`, {
        headers: this.createHeaders(apiToken)
      });
      
      if (response.data.success) {
        return {
          success: true,
          email: response.data.result.email,
          id: response.data.result.id
        };
      }
      
      return { success: false, error: 'Invalid token' };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.errors?.[0]?.message || 'Token validation failed' 
      };
    }
  }

  async listWorkers(apiToken, accountId) {
    try {
      const response = await axios.get(
        `${this.apiBase}/accounts/${accountId}/workers/scripts`,
        {
          headers: this.createHeaders(apiToken)
        }
      );
      
      if (response.data.success) {
        return {
          success: true,
          workers: response.data.result || []
        };
      }
      
      return { success: false, error: 'Failed to list workers' };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.errors?.[0]?.message || 'Failed to list workers' 
      };
    }
  }

  async deployWorker(apiToken, accountId, workerName, scriptContent) {
    try {
      const response = await axios.put(
        `${this.apiBase}/accounts/${accountId}/workers/scripts/${workerName}`,
        scriptContent,
        {
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/javascript'
          }
        }
      );
      
      if (response.data.success) {
        return {
          success: true,
          worker: response.data.result,
          url: `https://${workerName}.${accountId}.${config.CLOUDFLARE.WORKERS_SUBDOMAIN}`
        };
      }
      
      return { success: false, error: 'Failed to deploy worker' };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.errors?.[0]?.message || 'Failed to deploy worker' 
      };
    }
  }

  async deleteWorker(apiToken, accountId, workerName) {
    try {
      const response = await axios.delete(
        `${this.apiBase}/accounts/${accountId}/workers/scripts/${workerName}`,
        {
          headers: this.createHeaders(apiToken)
        }
      );
      
      if (response.data.success) {
        return { success: true };
      }
      
      return { success: false, error: 'Failed to delete worker' };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.errors?.[0]?.message || 'Failed to delete worker' 
      };
    }
  }

  async getWorkerScript(apiToken, accountId, workerName) {
    try {
      const response = await axios.get(
        `${this.apiBase}/accounts/${accountId}/workers/scripts/${workerName}`,
        {
          headers: this.createHeaders(apiToken)
        }
      );
      
      return {
        success: true,
        script: response.data
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.errors?.[0]?.message || 'Failed to get worker script' 
      };
    }
  }

  async createWorkerRoute(apiToken, zoneId, pattern, workerName) {
    try {
      const response = await axios.post(
        `${this.apiBase}/zones/${zoneId}/workers/routes`,
        {
          pattern: pattern,
          script: workerName
        },
        {
          headers: this.createHeaders(apiToken)
        }
      );
      
      if (response.data.success) {
        return { success: true, route: response.data.result };
      }
      
      return { success: false, error: 'Failed to create route' };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.errors?.[0]?.message || 'Failed to create route' 
      };
    }
  }
}

module.exports = new CloudflareService();