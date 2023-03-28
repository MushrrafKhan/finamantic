const { Joi } = require('../../util/validations');

const requireId = Joi.object().keys({
    id: Joi.objectId()
        .valid()
        .required(),
});

const updateStatus = Joi.object().keys({
    id: Joi.objectId()
        .valid()
        .required(),
    isSuspended: Joi.boolean().required(),
});

const edit = Joi.object().keys({
    title: Joi.string()
        .trim()
        .optional()
        .max(50),
    description: Joi.string()
        .trim()
        .optional()
        .min(5),
    files: Joi.string()
        .optional()
        .allow(''),
})
.xor('title')
.xor('description')
.with('title', 'description');

module.exports = {
    updateStatus,
    requireId,
    edit,
};
