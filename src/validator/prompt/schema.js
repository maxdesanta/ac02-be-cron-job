const Joi = require('joi');

const PromptPayLoadSchema = Joi.object({
    prompt: Joi.string().min(3).required(),
});

module.exports = { PromptPayLoadSchema };