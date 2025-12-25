"use strict";
const { v4: uuidv4 } = require("uuid");

class ChatSession {
  constructor(userId, engineerName) {
    this.id = uuidv4();
    this.userId = userId;
    this.engineerName = engineerName;
    this.messages = [];
    this.isActive = true;
    this.createdAt = new Date();
    this.lastActivity = new Date();
    this.context = {
      currentEngine: null,
      currentIssue: null,
    };
  }
}

class ChatMessage {
  constructor(sessionId, message, metadata = []) {
    this.id = uuidv4();
    this.sessionId = sessionId;
    this.message = message;
    this.metadata = metadata; 
    this.timestamp = new Date();
    this.isRead = false;
  }
}

module.exports = { ChatSession, ChatMessage };
