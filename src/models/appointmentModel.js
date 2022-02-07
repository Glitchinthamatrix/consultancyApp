const mongoose = require('mongoose');
const Slot = require('./slotModel');

const appointmentSchema = new mongoose.Schema({
    slot: {
        type: mongoose.ObjectId,
        ref: 'subSlot'
    },
    user: {
        type: mongoose.ObjectId,
        ref: 'User'
    },
    appointmentDate: Date,
    rating: Number,
    status: {
        type: String,
        enum: ['Cancelled', 'Approved', 'Completed'],
        default: 'Approved'
    }
}, { timestamps: true });

// appointmentSchema.pre('save', function(next){
// 	const start = new Date();
// 	start.setHours(this.start.split(':')[0]);
// 	start.setMinutes(this.start.split(':')[1]);
// 	start.getTime() + this.inte

// })

// appointmentSchema.pre('save', function(next){
// 	var rightNow = new Date(Date.now());
//   console.log(rightNow, this.appointmentDate);
//   console.log('hi');
//   console.log(rightNow <= this.appointmentDate);
// 	if(rightNow < this.appointmentDate){
// 		next();
// 	} else {
// 		var err = new Error('Appointment Invalid');
// 		next(err);
// 	}
// })


const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;