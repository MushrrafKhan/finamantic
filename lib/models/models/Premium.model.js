const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const Premium = new Schema(
    {
       
        subscription_id:{
            type:String,
            required:true
        },
        subscription_name:{
            type:String,
            required:true
        }, 
        subscription_amount:{
            type:String,
            required:true
        }, 
        device_type:{
            type:String,
            required:true
        },
        features:{
            type:String,
            required:true
        },
        duration:{
            type:Number,
            default:1
        },
        isActive:{
           type:Boolean,
           default:true
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

module.exports = mongoose.model('Premium', Premium);