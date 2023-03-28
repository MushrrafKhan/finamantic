const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const StaticPageSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            default: ''
        },
        slug: {
            type: String,
            required: true,
            default: ''
        },
        description: {
            type: String,
            required: true,
            default: ''
        }
    },
    {
        timestamps: {
            createdAt: 'created',
            updatedAt: 'updated'
        },
        id: false,
        toJSON: {
            getters: true
        },
        toObject: {
            getters: true
        },
    }
)

module.exports = mongoose.model('pages', StaticPageSchema);