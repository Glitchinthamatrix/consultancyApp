const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const doctorSchema = new mongoose.Schema({
    achievements: [String],
    experience: Number,
    location: String,
    description: String,
    specializations: { type: [String] },
    keywords: { type: [String] },
    proof: { type: String, required: true },
    cateogry: { type: String, required: true },
    qualifications: { type: [String] },
    awards: { type: [String] },
    avg_fees: { type: Number },
    startTime: { type: String },
    rating: Number,
    noOfRatings: Number,
    rates: [{
        service: String,
        charge: Number
    }],
    endTime: { type: String },
    slotDuration: { type: Number },
    subslots: []
        //hospitalList: [String]
        // slots ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

const Doctor = mongoose.model('Consultant', doctorSchema);

module.exports = {
    doctorSchema: doctorSchema,
    Doctor: Doctor
};