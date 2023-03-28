const { Joi, common } = require('../../util/validations');

const logIn = Joi.object().keys({
    email: Joi.string().required(),
    password: Joi.string().optional().allow(),
    deviceToken: Joi.string().trim().optional().allow(''),
    deviceId: Joi.string().trim().optional().allow(''),
    deviceType: Joi.string().trim().optional().allow(''),
    //role : Joi.string().trim().required()
});

module.exports = {
    logIn
};
