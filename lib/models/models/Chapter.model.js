const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const ChaptersSchema = new Schema(
    {
        chapter_no: {
            type: String,
            required: true,
            default: ''
        },
        title: {
            type: String,
            required: true,
            default: ''
        },
        description: {
            type: String,
            required: true,
            default: ''
        },
        isActive:{
            type:Boolean,
            default:true,
        },
        isDeleted:{
            type:Boolean,
            default:false,
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

module.exports = mongoose.model('chapter', ChaptersSchema);