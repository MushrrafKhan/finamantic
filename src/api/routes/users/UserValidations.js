const {Joi, common} = require('../../util/validations');
const {languages} = require('../../../../lib/i18n');

const requireId = Joi.object().keys({
    id: Joi.objectId()
        .valid()
        .optional().allow('')
});

const updatePassword = Joi.object().keys({
    currentPassword: Joi.string().required(),
    newPassword: common.password,
    confirmPassword: Joi.string()
        .required()
        .valid(Joi.ref('newPassword'))
        .error(([error]) => {
            const {locale} = error.options;
            const language = languages[locale];
            return {
                message: language.validation.custom.sameAs(error.context.key, 'newPassword'),
            };
        }),
});

module.exports = {
    requireId,
    updatePassword,
};
