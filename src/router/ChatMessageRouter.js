'use strict';

const express = require('express');
const chatMessageRouter = express.Router();

// import controller
const { ChatMessageController } = require('../controller/ChatMessageController');
const { Auth } = require('../middleware/auth');

chatMessageRouter.post('/generate', Auth.authenticate, ChatMessageController.generativeAsk);
chatMessageRouter.get('/message', Auth.authenticate, ChatMessageController.messageShowById);

module.exports = { chatMessageRouter };