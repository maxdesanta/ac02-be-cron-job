'use strict';

const jwt = require('jsonwebtoken');

const generateAccessToken = (user) => {
    return jwt.sign(user, process.env.SECRET_KEY, {expiresIn: '1d'});
};

const generateRefreshToken = (user) => {
    return jwt.sign(user, process.env.REFRESH_SECRET_KEY, {expiresIn: '7d'});
};

const verifyAccessToken = async (token) => {
    try {
        return jwt.verify(token, process.env.SECRET_KEY);
    } catch (err) {
        return null;
    }
};

const verifyRefreshToken = async (token) => {
    try {
        return jwt.verify(token, process.env.REFRESH_SECRET_KEY); 
    } catch (err) {
        throw err;
    }
};

module.exports = { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken };