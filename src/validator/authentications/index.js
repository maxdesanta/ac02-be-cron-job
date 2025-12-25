const InvariantError = require("../../exeptions/InvariantError");
const { RefreshTokenSchema } = require("./schema");

const RefreshTokenValidator = {
    validateRefreshTokenPayload: (payload) => {
        const validationResult = RefreshTokenSchema.validate(payload);

        if (validationResult.error) {
        throw new InvariantError(validationResult.error.message);
        }
    },
};

module.exports = RefreshTokenValidator;
