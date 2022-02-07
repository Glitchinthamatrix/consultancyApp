const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const doctorSchema = require('./doctorModel');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Every user must have a name.']
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
        required: [true, 'Every user must have a gender.']
    },
    dob: {
        type: Date,
        required: [true, 'Every user must have a DOB']
    },
    phoneNumber: {
        type: Number,
        required: [true, 'Every user must have a phone number'],
        unique: true,
        validate: {
            validator: function(number) {
                return `${number}`.length === 10;
            },
            message: err => `${err.value} is not a valid number`
        }
    },
    email: {
        type: String,
        unique: true,
        required: [true, 'Every user must have a email address']
    },
    password: {
        type: String,
        required: [true, 'Every user must have a password.']
    },
    location: {
        type: String,
        // required: [true, 'Every user must provide a city name']
    },
    state: {
        type: String,
        // required: [true, 'Every user must provide a state name']
    },
    country: {
        type: String,
        // required: [true, 'Every user must provide a country name']
    },
    display_picture: {
        type: String
    },
    proofOfWork: {
        type: String
    },
    bloodGroup: {
        type: String,
        enum: ['undefined', 'O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']
    },
    timeZone: {
        type: String
    },
    role: {
        type: String,
        enum: ['admin', 'user', 'doctor'],
        default: 'user'
    },
    doctor: doctorSchema.doctorSchema
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});


userSchema.pre('save', async function(next) {
    const passwordValidator = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/;
    if (this.isModified('password')) {
        if (passwordValidator.test(this.password)) next();
        else {
            const err = new Error('Password must contain One Uppercase, One lowercase and One number character');
            next(err);
        }
    }
})

userSchema.virtual('slots', {
    ref: 'Slot',
    foreignField: 'doctor',
    localField: '_id'
});


userSchema.post('find', async function(docs, next) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    for await (let doc of docs) {
        if (doc.role === 'doctor') {
            await doc.populate('slots').execPopulate();
            let subslotsArray = [
                [],
                [],
                [],
                [],
                [],
                [],
                []
            ];
            for (let i = 0; i < doc.slots.length; i++) {
                for (let j = 0; j < doc.slots[i].days.length; j++) {
                    subslotsArray[days.indexOf(doc.slots[i].days[j])] = doc.slots[i].subSlots;
                }
            }
            doc.doctor ? doc.doctor.subslots = subslotsArray : '';
        }
    }
    next();
});



userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        console.log('hashing and saving new password ', this.password)
        this.password = await bcrypt.hash(this.password, 12);
        console.log('hashed and saved new password ')
        next();
    }
});

userSchema.methods.comparePassword = async function(hashedPassword, enteredPassword) {
    return await bcrypt.compare(hashedPassword, enteredPassword);
}

const User = mongoose.model('User', userSchema);

module.exports = User;