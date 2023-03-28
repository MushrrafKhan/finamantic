const mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    bcrypt = require('bcrypt');

const AdminSchema = new Schema(
    {
        firstName: {
            type: String,
            trim: true,
            required: true,
        },
        lastName: {
            type: String,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },
        contactNumber: {
            type: String,
        },
        password: {
            type: String,
            required: true,
        },
        start_exp_year: {
            type: String
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        isSuspended: {
            type: Boolean,
            default: true,
        },
        resetToken: String,
        authTokenIssuedAt: Number,
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

AdminSchema.pre('save', async function(next) {
    const admin = this;
    if (!admin.isModified('password')) return next();
    try {
        const saltRounds = parseInt(process.env.BCRYPT_ITERATIONS, 10) || 10;
        admin.password = await bcrypt.hash(admin.password, saltRounds);
        next();
    } catch (e) {
        next(e);
    } 
});

AdminSchema.methods.comparePassword = async function(password) {
    try {
        return await bcrypt.compare(password, this.password);
    } catch (e) {
        return false;
    }
};

module.exports = mongoose.model('Admin', AdminSchema);
