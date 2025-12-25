'use strict';

const express = require('express');
const userRouter = express.Router();

// controller
const { UserController } = require('../controller/UserController');
const { Auth } = require('../middleware/auth');

userRouter.post('/register', UserController.Register);
userRouter.post('/login', UserController.Login);
userRouter.post('/tokens', UserController.RefreshToken);
userRouter.get('/profile', Auth.authenticate, UserController.Profile);

module.exports = { userRouter };