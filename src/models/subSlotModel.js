const mongoose = require('mongoose');

const subSlotSchema = new mongoose.Schema({
    startTime: String,
    endTime: String,
    doctor: {
        type: mongoose.ObjectId,
        ref: 'Doctor',
    },
    isBooked: {
        type: Boolean,
        default: false
    },
    isDisabled: {
        type: Boolean,
        default: false
    }
});

const subSlot = mongoose.model('subSlot', subSlotSchema);

module.exports = {
    subSlot: subSlot,
    subSlotSchema: subSlotSchema
}