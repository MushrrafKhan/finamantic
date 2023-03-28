const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const AdminSettings = new Schema(
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
        isDeleted: {
            type: Boolean,
            default: false
        },        
        radius: {
            type: Number,
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

module.exports = mongoose.model('AdminSettings', AdminSettings);