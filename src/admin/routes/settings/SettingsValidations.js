const { Joi } = require('../../util/validations');

const settings = Joi.object().keys({
    androidAppVersion: Joi.string()
        .regex(/^[\d]+\.[\d]+\.[\d]+$/, 'Semantic Version')
        .required(),
    androidForceUpdate: Joi.boolean().required(),
    iosAppVersion: Joi.string()
        .regex(/^[\d]+\.[\d]+\.[\d]+$/, 'Semantic Version')
        .required(),
    iosForceUpdate: Joi.boolean().required(),
    radius: Joi.number().required()
});

module.exports = {
    settings,
};