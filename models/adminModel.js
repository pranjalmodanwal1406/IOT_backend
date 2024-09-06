const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const AdminSchema = mongoose.Schema(
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
        isAdmin: {
            type: Boolean,
            default: true
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


module.exports = mongoose.model('Admin', AdminSchema);