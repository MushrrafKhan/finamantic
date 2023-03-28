const { Joi, common } = require('../../util/validations');
const { languages } = require('../../../../lib/i18n');

const logIn = Joi.object().keys({
    email: common.email,
    password: Joi.string().required(),
});

const forgotPassword = Joi.object().keys({
    email: common.email,
});

const resetPassword = Joi.object().keys({
    //otp: Joi.string().required(),
    newPassword: common.password,
    confirmPassword: Joi.string()
    .required()
    .valid(Joi.ref('newPassword'))
    .error(([error]) => {
        const { locale } = error.options;
        const language = languages[locale];
        return {
            message: language.validation.custom.sameAs(error.context.key, 'newPassword'),
        };
    })
});

const profile = Joi.object().keys({
    firstName: Joi.string()
        .trim()
        .min(3)
        .max(30)
        .required(),
    lastName: Joi.string()
        .trim()
        .min(3)
        .max(30)
        .required(),
    email: common.email,
    contactNumber: Joi.string()
});

const updatePassword = Joi.object().keys({
    currentPassword: Joi.string().required(),
    newPassword: common.password,
    confirmPassword: Joi.string()
        .required()
        .valid(Joi.ref('newPassword'))
        .error(([error]) => {
            const { locale } = error.options;
            const language = languages[locale];
            return {
                message: language.validation.custom.sameAs(error.context.key, 'newPassword'),
            };
        }),
});

const isEmailExists = Joi.object().keys({
    email: common.email,
    id: Joi.objectId()
        .valid()
        .optional(),
});

const counts = Joi.object().keys({
    dateFrom: Joi.date()
        .optional()
        .allow('')
        .error(([error]) => {
            const { locale } = error.options;
            const language = languages[locale];
            return {
                message: language.validation.date.valid('dateFrom'),
            };
        }),
    dateTo: Joi.date()
        .optional()
        .allow('')
        .error(([error]) => {
            const { locale } = error.options;
            const language = languages[locale];
            return {
                message: language.validation.date.valid('dateTo'),
            };
        }),
});

module.exports = {
    logIn,
    profile,
    updatePassword,
    forgotPassword,
    resetPassword,
    isEmailExists,
    counts
};
