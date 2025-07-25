const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const fs = require('fs-extra');
const path = require('path');
const config = require('./config');

class Database {
  constructor() {
    this.dbPath = config.SESSION_FILE;
    this.db = null;
    this.init();
  }

  async init() {
    // Ensure directory exists
    await fs.ensureDir(path.dirname(this.dbPath));
    
    // Initialize database
    const adapter = new JSONFile(this.dbPath);
    this.db = new Low(adapter, { users: {} });
    
    // Read data from JSON file
    await this.db.read();
    
    // Initialize default data if file is empty
    if (!this.db.data) {
      this.db.data = { users: {} };
      await this.db.write();
    }
  }

  async getUser(userId) {
    await this.db.read();
    return this.db.data.users[userId] || null;
  }

  async setUser(userId, userData) {
    await this.db.read();
    this.db.data.users[userId] = {
      ...this.db.data.users[userId],
      ...userData,
      lastUpdated: new Date().toISOString()
    };
    await this.db.write();
  }

  async updateUserStep(userId, step, data = {}) {
    await this.db.read();
    if (!this.db.data.users[userId]) {
      this.db.data.users[userId] = {};
    }
    
    this.db.data.users[userId] = {
      ...this.db.data.users[userId],
      currentStep: step,
      stepData: data,
      lastUpdated: new Date().toISOString()
    };
    await this.db.write();
  }

  async clearUserStep(userId) {
    await this.db.read();
    if (this.db.data.users[userId]) {
      delete this.db.data.users[userId].currentStep;
      delete this.db.data.users[userId].stepData;
      this.db.data.users[userId].lastUpdated = new Date().toISOString();
      await this.db.write();
    }
  }

  async isUserLoggedIn(userId) {
    const user = await this.getUser(userId);
    return user && user.apiToken && user.accountId && user.zoneId;
  }

  async getUserCredentials(userId) {
    const user = await this.getUser(userId);
    if (!user || !user.apiToken || !user.accountId || !user.zoneId) {
      return null;
    }
    
    return {
      apiToken: user.apiToken,
      accountId: user.accountId,
      zoneId: user.zoneId,
      email: user.email
    };
  }

  async storeTemporaryData(userId, key, data) {
    await this.db.read();
    if (!this.db.data.users[userId]) {
      this.db.data.users[userId] = {};
    }
    
    if (!this.db.data.users[userId].tempData) {
      this.db.data.users[userId].tempData = {};
    }
    
    this.db.data.users[userId].tempData[key] = {
      data: data,
      timestamp: new Date().toISOString()
    };
    
    this.db.data.users[userId].lastUpdated = new Date().toISOString();
    await this.db.write();
  }

  async getTemporaryData(userId, key) {
    await this.db.read();
    const user = this.db.data.users[userId];
    
    if (!user || !user.tempData || !user.tempData[key]) {
      return null;
    }
    
    // Check if data is older than 1 hour (3600000 ms)
    const timestamp = new Date(user.tempData[key].timestamp);
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 3600000);
    
    if (timestamp < hourAgo) {
      // Data is too old, remove it
      delete user.tempData[key];
      await this.db.write();
      return null;
    }
    
    return user.tempData[key].data;
  }

  async clearTemporaryData(userId, key = null) {
    await this.db.read();
    const user = this.db.data.users[userId];
    
    if (!user || !user.tempData) {
      return;
    }
    
    if (key) {
      // Clear specific key
      delete user.tempData[key];
    } else {
      // Clear all temporary data
      user.tempData = {};
    }
    
    user.lastUpdated = new Date().toISOString();
    await this.db.write();
  }
}

module.exports = new Database();