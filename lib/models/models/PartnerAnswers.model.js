const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const PartnerAnswersModelSchema = new Schema(
    {
        senderId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        chapter: {
            type: Schema.Types.ObjectId,
            ref: 'Chapter',
        },
        questionId: {
            type: Schema.Types.ObjectId,
            ref: 'Question',
        },
        dayOfWeek: {
            type: Array,
            default: [],
        },
        timeOfDay: {
            type: String,
            default: '',
        },
        subjectOfPrayer: {
            type: String,
            default: '',
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
module.exports = mongoose.model('partneranswers', PartnerAnswersModelSchema);
