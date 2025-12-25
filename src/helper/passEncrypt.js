'use strict';

const bcrypt = require('bcrypt');

const hashPassword = async (password) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        return hash;
    } catch (err) {
        throw new Error(`Error in hashPassword: ${err}`);
    }
};

const verifyPass = async (password, hash) => {
    try {
        const isMatch = await bcrypt.compare(password, hash);

        return isMatch;
    } catch (err) {
        throw new Error(`Error in verifyPass: ${err}`);
    }
};

module.exports = { hashPassword, verifyPass };