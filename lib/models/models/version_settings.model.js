const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const VersionSettings = new Schema(
    {
        androidAppVersion: {
            type: String,
            trim: true,
            required: true,
        },
        iosAppVersion: {
            type: String,
            trim: true,
            required: true,
        },
        notification_setting: {
            type: Number,
            required: true,
        },
        androidForceUpdate: {
            type: Boolean,
            required: true,
            default: true
        },
       
        iosForceUpdate: {
            type: Boolean,
            required: true,
            default: true
        },
       radius:{
           type:Number
            
       },
        isDeleted: {
            type: Boolean,
            default: false
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

module.exports = mongoose.model('version_settings', VersionSettings);