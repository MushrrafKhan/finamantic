const mongoose = require('mongoose'),
    Schema = mongoose.Schema;
  

const CategorySchema = new Schema(
    {
       name:{
           type:String,
           required:true
        },
        isDeleted:{
            type: Boolean,
            default: false,
         },
         isSuspended:  {
            type: Boolean,
            default: false
         },
         image:{
            type:String,
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


module.exports = mongoose.model('category', CategorySchema);
