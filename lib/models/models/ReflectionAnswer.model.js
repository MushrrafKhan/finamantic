const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const ReflectionAnswerSchema = new Schema(
    {
        user:{
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        chapter: {
            type: Schema.Types.ObjectId,
            ref: 'Chapter',
        },
        questionId:{
            type: Schema.Types.ObjectId,
            ref: 'Question',
        },
        description:{
            type:String,
            default:''
        }
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
module.exports = mongoose.model('reflectionans', ReflectionAnswerSchema);
