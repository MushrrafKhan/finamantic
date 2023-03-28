const { Joi, patterns } = require('../../util/validations');

const uploadFile = Joi.object().keys({
    location: Joi.string()
        .trim()
        .required(),
    type: Joi.string()
        .valid('IMAGE', 'DOCUMENT.PDF')
        .required(),
    count: Joi.string()
        .regex(patterns.number, 'numberPattern')
        .required(),
});

module.exports = {
    uploadFile,
};
