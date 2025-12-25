const Joi = require('joi');

const RefreshTokenSchema = Joi.object({
    refreshToken: Joi.string().required(),
});

module.exports = { RefreshTokenSchema };