const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const QuestionSchema = new Schema(
    {
        chapter: {
            type: Schema.Types.ObjectId,
            ref: 'Chapter',
        },
        questionType: {
            type: String,
            default: '',
            //[optional,description]
        },
        title: {
            type: String,
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: {
            createdAt: 'created',
            updatedAt: 'updated',
        },
        id: false,
        toJSON: {
            getters: true,
        },
        toObject: {
            getters: true,
        },
    }
);
module.exports = mongoose.model('question', QuestionSchema);
