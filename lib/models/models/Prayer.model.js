const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const PrayerSchema = new Schema(
    {
        chapter:{
            type: Schema.Types.ObjectId,
            ref: 'Chapter'
        },
        description: {
            type: String,
            required: true,
            default: ''
        },
        isActive:{
            type:Boolean,
            default:true
        },
        isDeleted:{
            type:Boolean,
            default:false
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

module.exports = mongoose.model('prayer', PrayerSchema);