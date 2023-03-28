const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const ShareChaptersModelSchema = new Schema(
    {
        
        senderId:{
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        chapter: {
            type: Schema.Types.ObjectId,
            ref: 'Chapter',
        },
        receiverId:{
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        questionId:{
            type: Schema.Types.ObjectId,
            ref: 'Question'
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
module.exports = mongoose.model('sharechapters', ShareChaptersModelSchema);
