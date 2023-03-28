const { Joi, common } = require('../../util/validations');

const logIn = Joi.object().keys({
    email: common.email,
    password: Joi.string().required(),
    deviceToken: Joi.string().trim().optional().allow('')
});

module.exports = {
    logIn,
};
