require('joi-i18n');
let Joi = require('joi');
const { languages } = require('./../../../lib/i18n');
const { getLanguage } = require('./common');
const { isValidObjectId, logError } = require('./../../../lib/util');

const validate = (schema, field = 'body', options = {}) => (req, res, next) => {
    const { error, value } = schema.validate(req[field], {
        locale: getLanguage(req),
        ...options,
    });

    if (!error) {
        req[field] = value;
        return next();
    }

    if (process.env.NODE_ENV === 'development') {
        logError(`${req.method} ${req.originalUrl}`, '\x1b[33m', error.details[0].message, '\x1b[0m');
    }

    return res.warn(null, error.details[0].message);
};

Object.keys(languages).forEach(language => Joi.addLocaleData(language, languages[language].validation));

const patterns = {
    password: /^(?=(.*[a-zA-Z])+)(?=(.*[0-9])+).{8,}$/,
    email: /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    countryCode: /^\+[\d]+$/,
    phone: /^[\d]+$/,
    number: /^[\d]+$/,
    otp: /^[\d]+$/,
};

Joi = Joi.extend(joi => ({
    base: joi.string(),
    name: 'objectId',
    rules: [
        {
            name: 'valid',
            validate(params, value, state, options) {
                if (!isValidObjectId(value)) {
                    return this.createError('objectId.valid', {}, state, options);
                }
                return value;
            },
        },
    ],
}));

const common = {
    password: Joi.string()
        .max(72)
        .regex(patterns.password, 'passwordPattern')
        .required()
        .error(([error]) => {
            const { locale } = error.options;
            const language = languages[locale];
            let message = '';
            switch (error.type) {
            case 'any.required':
            case 'any.empty':
                message = language.validation.any.required(error);
                break;
            case 'string.regex.name':
                message = language.validation.string.regex.name(error);
                break;
            case 'string.max':
                message = language.validation.string.max(error);
                break;
            }
            return { message };
        }),
    token: Joi.string()
        .trim()
        .hex()
        .required(),
    email: Joi.string()
        .trim()
        .lowercase()
        .regex(patterns.email, 'emailPattern')
        .required(),
    countryCode: Joi.string().regex(patterns.countryCode, 'countryCodePattern'),
    phone: Joi.string()
        .min(7)
        .max(12)
        .regex(patterns.phone, 'phonePattern'),
    otp: Joi.string()
        .length(4, 'utf8')
        .regex(patterns.otp, 'otpPattern')
        .required(),
};

module.exports = { Joi, patterns, validate, common };
