const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const SubscriptionSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        // required:true
    },
    subscriptionType: {
        type: String,
    },
    isActive:{
        type:Boolean,
        default:true
    },
    startingTime: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model('subscription', SubscriptionSchema);
