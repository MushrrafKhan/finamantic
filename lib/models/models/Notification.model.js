const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const NotificationSchema = new Schema(
    {
        senderId:{
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        receiverId:{
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        title:{
            type:"String"
        },
        statusType:{
            type:"String"
        },
        accessToken: {           /// for plaid api 
            type: String,
        },
        goalId:{
            type: Schema.Types.ObjectId,
            ref: 'Goal',
        },
        chapterId:{
            type:Schema.Types.ObjectId,
            ref:'Chapter'
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

module.exports = mongoose.model('notification', NotificationSchema);
