const mongoose = require('mongoose');
const subSlotSchema = require('./subSlotModel.js').subSlotSchema;
const subSlot = require('./subSlotModel.js').subSlot;

const slotSchema = new mongoose.Schema({
    startTime: String,
    endTime: String,
    interval: Number,
    days: {
        type: [String],
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    doctor: {
        type: mongoose.ObjectId,
        ref: 'Doctor',
    },
    hospital: String,
    subSlots: [subSlotSchema],
    holiday: {
        type: Boolean,
        default: false
    },
    isDisabled: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });


slotSchema.pre('save', async function(next) {
    const doctor = this.doctor;
    const start = new Date();
    start.setHours(parseInt(this.startTime.split(':')[0]));
    start.setMinutes(parseInt(this.startTime.split(':')[1]));
    const end = new Date();
    end.setHours(parseInt(this.endTime.split(':')[0]));
    end.setMinutes(parseInt(this.endTime.split(':')[1]));

    const slots = [];
    const slotsWithDate = [];
    async function generateSlots(start, end, interval) {
        let startTime = start.getTime();
        let endTime = end.getTime();
        let duration = parseInt(interval) * 60 * 1000;
        let slotEndTime = start.getTime();
        while (startTime + duration <= endTime) {
            slotEndTime += duration;
            let startDate = new Date(startTime);
            let endDate = new Date(slotEndTime);
            slot = [`${startDate.toLocaleString().split(', ')[1].split(':')[0]}:${startDate.toLocaleString().split(', ')[1].split(':')[1]} ${startDate.toLocaleString().split(', ')[1].split(':')[2].split(' ')[1]}`, `${endDate.toLocaleString().split(', ')[1].split(':')[0]}:${endDate.toLocaleString().split(', ')[1].split(':')[1]} ${endDate.toLocaleString().split(', ')[1].split(':')[2].split(' ')[1]}`]
            slots.push(slot);
            startTime = slotEndTime;
            // console.log(slot.toLocaleString().split(', ')[1].split(' ')[0].split(':'));
        }
        // console.log(slotsWithDate);
    }

    await generateSlots(start, end, this.interval);
    this.subSlots = [];
    for (let i = 0; i < slots.length; i++) {
        console.log('slot in loop: ', slots[i]);
        console.log('added doctor: ', doctor);
        let subslot = await subSlot.create({
            startTime: slots[i][0],
            endTime: slots[i][1],
            doctor: doctor
        });
        this.subSlots.push(subslot);
    }
    // slots.forEach(async el => {
    // 	let slot = await subSlot.create({
    // 		startTime: el[0],
    // 		endTime: el[1]
    // 	});
    // 	this.subSlots.push(slot);
    // })
    console.log(this.subSlots);
    next();
})


const Slot = mongoose.model('Slot', slotSchema);

module.exports = Slot;