const { Joi } = require('../../util/validations');

const requireId = Joi.object().keys({
    id: Joi.objectId()
        .valid()
        .required(),
});

const requireSlug = Joi.object().keys({
    slug: Joi.string()
        .required(),
    id: Joi.objectId()
        .valid()
        .optional(),
});

const add = Joi.object().keys({
    name: Joi.string()
        .trim()
        .min(3)
        .max(30)
        .required()
});

const edit = Joi.object().keys({
    name: Joi.string()
        .trim()
        .min(3)
        .max(30)
        .required()
});

const updateStatus = Joi.object().keys({
    id: Joi.objectId()
        .valid()
        .required(),
    status: Joi.boolean().required(),
});

module.exports = {
    requireId,
    requireSlug,
    add,
    edit,
    updateStatus,
};
