'use strict';

const { UserModel } = require('../model/UserModel');

// error handler
const InvariantError = require('../exeptions/InvariantError');
const UserValidator = require('../validator/user');

class UserController { 
    // register
    static async Register(req, res) { 
        const { username, email, password } = req.body;
        try {
            UserValidator.validateUserPayload(req.body)

            const result = await UserModel.RegisterModel(username, email, password);
            res.json(
                {
                    status: 'success',
                    data: {
                        message: result 
                    }
                }
            );
        } catch (error) {
            if (error instanceof InvariantError) {
                return res.status(400).json({
                    status: 'fail',
                    message: error.message
                });
            }

            return res.status(400).json({ 
                status: 'fail',
                message: error.message 
            });
        }
    }

    // login
    static async Login(req, res, next) { 
        const { email, password } = req.body;
        try {
            const result = await UserModel.LoginModel(email, password);

            if(!result.user) { 
                return res.status(400).json({
                    status: 'fail',
                    message: result.message
                });
            }
            
            if(result.accessToken && result.refreshToken) {
                return res.status(200).json({
                    status: 'success',
                    data: {
                        accessToken: result.accessToken,
                        refreshToken: result.refreshToken
                    }
                });
            }

            if(result.token && result.isMatch) {
                return res.status(200).json({
                    status: 'success',
                    data: {
                        token: result.token
                    }
                });
            } else {
                return res.status(400).json({
                    status: 'fail',
                    message: result.message
                });
            }
            

            next();
            return;
        } catch (error) {
            if (error instanceof InvariantError) {
                return res.status(400).json({
                    status: 'fail',
                    message: error.message
                });
            }

            return res.status(400).json({ 
                status: 'fail',
                message: error.message 
            });
        }
    }

    // get user
    static async Profile(req, res) { 
        const { user } = req;

        try { 
            const result = await UserModel.profileModel(user.id);
            res.json({
                status: 'success',
                data: result
            });
        } catch (error) {
            if (error instanceof InvariantError) {
                return res.status(400).json({
                    status: 'fail',
                    message: error.message
                });
            }

            return res.status(400).json({ 
                status: 'fail',
                message: error.message 
            });
        }
    }

    static async RefreshToken(req, res) {
        const { refreshToken } = req.body;
        try {
            const result = await UserModel.RefreshTokenModel(refreshToken);
            res.json({
                status: 'success',
                data: result
            });
        } catch (error) {
            if (error instanceof InvariantError) {
                return res.status(400).json({
                    status: 'fail',
                    message: error.message
                });
            }

            return res.status(400).json({ 
                status: 'fail',
                message: error.message 
            });
        }
    }
};

module.exports = { UserController };