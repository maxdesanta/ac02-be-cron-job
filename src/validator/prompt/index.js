const InvariantError = require('../../exeptions/InvariantError');
const { PromptPayLoadSchema } = require('./schema');

const PromptsValidator = {
    validatePromptPayload: (payload) => {
        const validationResult = PromptPayLoadSchema .validate(payload);

        if (validationResult.error) {
            throw new InvariantError(validationResult.error.message);
        }
    }
};

module.exports = PromptsValidator;