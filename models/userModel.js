const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const UserSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        username: {
            type: String,
            required: false,
        },
        mobileNumber: {
            type: String,
            required: false,
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: false
        },
        reason: {
            type: String,
            required: false
        },
        message: {
            type: String,
            required: false,
        },
        isactive: {
            type: Boolean,
            default: false,
        },
        isAdmin: {
            type: Boolean,
            default: false
        },

        resetToken: String,

        resetTokenExpiration: Date,

        role: String,

        otp: { type: String },
        otpExpiration: { type: Date },
    },
    {
        timestamps: true
    }
);


module.exports = mongoose.model('User', UserSchema);