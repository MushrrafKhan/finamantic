const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const GoalSchema = new Schema(
    {
        dateFrom: {                     ///// startDate
            type: Date,
            required: true
            // default: Date.now(),
        },
        dateTo: {                        ///// endDate
            type: Date,
            required: true,
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        title: {
            type: String,
            required: true,
            default: '',
        },
        budget: {
            type: String,
            required: true,
            default: '',
        },
        spent: {
            type: Number,
            default:10
        },
        amount:{
            type:Number,
        },
        category: {
            type: String,
            default:''
        },
        description: {
            type: String,
            required: true,
            default: '',
        },
        shareWith: {
                type: mongoose.Types.ObjectId,
                ref: 'User',
        },
        images: [
            {
                type: String,
            },
        ],
        isActive:{
            type:Boolean,
            default:false
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

module.exports = mongoose.model('goal', GoalSchema);
