const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PatientSchema = mongoose.Schema(
    {
        lastname: {
            type: String,
            required: true
        },
        firstname: {
            type: String,
            required: true
        },
        DOB: {
            type: Date,
            required: true
        },
        SSN: {
            type: String,
            required: true,
            unique: true
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        measureData: {
            type: Schema.Types.ObjectId,
            ref: 'MeasureData'
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Patient', PatientSchema);
