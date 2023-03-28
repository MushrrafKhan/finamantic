const mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    bcrypt = require('bcrypt');

const UserSchema = new Schema(
    {
       name: {
            type: String,
            trim: true,
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
        },
        phone: {
            type: String,
            default:""
        },
        password: {
            type: String,
            required: true,
        },
        image: {
            type: String,
            trim: true,
            default: '',
        },
        age:{
            type:Number,
        },
        gender:{
            type:String,
            default:""
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        deviceToken: {
            type: String,
            trim: true,
        },
        token: {
            type: Number,
            default: 0,
        },
        bankVerify: {           /// for plaid, (user bank account link = true OR user bank account not link = false)
            type: Boolean,
            default: false,
        },
        accessToken: {           /// for plaid api 
            type: String,
        },
        itemId: {                /// for plaid api 
            type: String,
        },
        deviceType: {
            type: String,
            trim: true,
        },
        emailVerify: {           
            type: Boolean,
            default: false,
        },
        deviceId: [
            {
                type: String,
            },
        ],
        otp: {
            type: String,
            default: '',
        },
        isNotification: {
            type: Boolean,
            default: true,
        },
        authTokenIssuedAt: Number,
        emailToken: {
            type: String,
            default: '',
        },
        resetToken: {
            //for forgot password
            type: String,
            default: '',
        },
        twoFA:{
            type:Boolean,
            default:false
        },
        subscription:{
            type:Boolean,
            default:false
        },
        subscriptionId:{
            type:Number,
        },
        subscriptionDate:{
            type: Date
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

UserSchema.pre('save', async function(next) {
    const user = this;

    if (!user.isModified('password')) return next();
    try {
        const saltRounds = parseInt(process.env.BCRYPT_ITERATIONS, 10) || 10;
        user.password = await bcrypt.hash(user.password, saltRounds);
        next();
    } catch (e) {
        next(e);
    }
});

UserSchema.methods.comparePassword = async function(password) {
    try {
        return await bcrypt.compare(password, this.password);
    } catch (e) {
        return false;
    }
};

module.exports = mongoose.model('User', UserSchema);
