const Joi = require('joi');

const UserPayLoadSchema = Joi.object({
    username: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
        'any.only': 'Password and confirm password does not match' 
    }),
});

module.exports = { UserPayLoadSchema };
