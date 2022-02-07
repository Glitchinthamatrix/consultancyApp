const Appointment = require('./../models/appointmentModel');
const Doctor = require('./../models/doctorModel').Doctor;
const User = require('./../models/userModel.js');
const Slot = require('./../models/slotModel.js');
const Mongoose = require('mongoose');
const authenticationController = require('./../controllers/authenticationController');
// const Appointment = require('./../models/appointmentModel.js');
const utils = require('../utils');
const Nexmo = require('nexmo');
const nexmo = authenticationController.nexmo;
const subSlotModel = require('./../models/subSlotModel.js');
const SubSlot = subSlotModel.subSlot;
const logInRed = (data) => {
    console.log('\x1b[31m%s\x1b[0m', data);
}
const logInGreen = (data) => {
    console.log('\x1b[32m%s\x1b[0m', data);
}

function send(message, recipientAdresses) {

    const from = 'Vonage SMS API';
    const to = '91' + recipientAdresses;
    const text = message;

    nexmo.message.sendSms(from, to, text);
}


const loadingDataOnAppointmentPage = async(req, res, next) => {

    console.log('in loadingDataOnAppointmentPage')
    console.log("date: " + req.query.date);
    var doctor = await User.findOne({ _id: req.params.id });
    var slot = await Slot.findOne({ doctor: Mongoose.Types.ObjectId(doctor._id) });
    utils.logInRed('found slot: ', slot);
    var subSlot = await SubSlot.findOne({ _id: Mongoose.Types.ObjectId(req.query.slot) });
    utils.logInRed('found subslot: ', subSlot);

    if (doctor) {
        console.log('cool! found the doctor: ', doctor);
        if (slot) {
            console.log('cool! found the slot: ', slot)
            if (subSlot) {
                console.log('cool! found the subSlot: ', subSlot)
                slot.subSlots = subSlot;
                console.log('slot with subSlots: ', slot)
                res.render('views/appointment.ejs', { slot: slot, doctor: doctor, user: res.locals.user, date: req.query.date })
                    // res.json({ date: req.query.date, slot: slot, subslot: subSlot })
            } else {
                res.send('could not find subSlot')
            }
        } else {
            res.send('could not find slot')
        }
    } else {
        res.send('could not find the doctor')
    }
}

const createAppointment = async(req, res, next) => {
    function convertDate(str) {
        var date = new Date(str),
            mnth = ("0" + (date.getMonth() + 1)).slice(-2),
            day = ("0" + date.getDate()).slice(-2);
        return [date.getFullYear(), mnth, day].join("/");
    }
    var appointmentDate = convertDate(req.query.appointmentDate);
    var subSlotId = req.params.id;
    console.log(res.locals.user._id + " is creating an appointment with subslot " + subSlotId + " at " + appointmentDate);
    var subSlot = await SubSlot.findOne({ _id: Mongoose.Types.ObjectId(subSlotId) });
    if (subSlot.isBooked) {
        res.send('this slot is already booked')
    };
    var doctor = await User.findOne({ _id: Mongoose.Types.ObjectId(subSlot.doctor) });
    const newAppointment = await Appointment.create({
        slot: req.params.id,
        user: res.locals.user._id,
        appointmentDate: appointmentDate
    });
    Slot.find({ doctor: subSlot.doctor })
        .then((slots) => {
            if (!slots) {
                logInRed('cant find slots to update slots.subslot.isBooked');
            } else {
                // logInGreen('found slots in createAppointment');
                // for (let i = 0; i < slots.length; i++) {
                //     logInGreen(`looping over this slot: ${slots[i]}`)
                //     var subslots = slots[i].subSlots;
                //     logInGreen(`slots[i].subSlots[0]: ${subslots[0]}`);
                //     for (j = 0; j < subslots.length; j++) {
                //         logInGreen(`current slot.subslot: ${subslots[j]}`)
                //         if (subslots[j]._id == newAppointment.slot) {
                //             logInGreen(`found subslot with appointment.slot: ${newAppointment.slot}`)
                //             subslots[j].isBooked = true;
                //             logInRed('set isBooked to true')
                //             logInRed(`set isBooked of ${subslots[j]._id} to true`);
                //             slots[i].save()
                //         }
                //     }
                //     //     .then((updatedSlot) => {
                //     //         if (updatedSlot) {
                //     //             logInGreen('slot updated successfully')
                //     //         } else {
                //     //             logInRed('could not update slot')
                //     //         }
                //     //     })
                // }
                slots.forEach((slot) => {
                    logInGreen('looping over this slot: ', slot)
                    slot.subSlots.forEach((subslot) => {
                        logInRed('found the wanted subslot: ', subslot);
                        if (subslot._id == newAppointment.slot) {
                            subslot.isBooked = true;
                            logInRed('set isBooked to true')
                            slot.save()
                                .then((newSlot, err) => {
                                    if (newSlot) {
                                        logInRed('new slot is ', newSlot)
                                    } else {
                                        logInRed('could not update slot.isBooked: ', err)
                                    }
                                }, e => { logInRed('error in saving updated slot: ', e) })
                                .catch((err) => { logInRed('error in saving updated slot: ', err) })
                        }
                    })
                })
            }
        }, e => { logInRed(`fetch error, cant get slots: ${e}`) })
        .catch((e) => { logInRed(`error in getting Slot with doctor=${subSlot.doctor}:${e}`) });
    var bookedIsTrue = await SubSlot.findOneAndUpdate({ _id: Mongoose.Types.ObjectId(req.params.id) }, { $set: { isBooked: true } }, { new: true }, (err, doc) => {
        if (err) {
            console.log(`could not set isBooked to true for ${req.params.id}: `, err);
        } else {
            console.log(`set isBooked to true for ${req.params.id}: `, doc);
        }
    });
    var patient = await User.findOne({ _id: Mongoose.Types.ObjectId(newAppointment.user) });

    console.log('patient: ', patient);
    console.log('user: ', res.locals.user);
    console.log('subslot: ', subSlot);
    console.log('doctor: ', doctor);
    console.log("appointment date: ", appointmentDate);
    console.log('booked new appointment: ', newAppointment);
    console.log('set isBooked to true for this subSlott: ', bookedIsTrue);
    console.log("res.locals.appointment: " + newAppointment);
    // res.redirect('/appointment-booked');
    res.render('views/appointment_booked.ejs', { doctor: doctor, patient: patient, subSlot: subSlot, user: res.locals.user, appointmentDate: appointmentDate, appointment: newAppointment })
}

const appointmentBooked = async(req, res, next) => {
    const appointment = res.locals.appointment;
    console.log('got appointment in res.locals from createAppointmt: ', appointment);
    let subslot = await Slot.aggregate([{
            $unwind: '$subSlots'
        },
        {
            $match: { 'subSlots._id': Mongoose.Types.ObjectId(appointment.slot) }
        }

    ]);
    console.log({ appointmentBooked: res.locals.appointment, subslot: subslot });

    // const appointment = res.locals.appointment;
    // if (appointment) {
    //     const patient = await User.findOne({ _id: appointment.user });
    //     let subslot = await Slot.aggregate([{
    //             $unwind: '$subSlots'
    //         },
    //         {
    //             $match: { 'subSlots._id': Mongoose.Types.ObjectId(appointment.slot) }
    //         }
    //     ]);
    //     subslot = subslot[0];
    //     console.log(subslot);
    //     const doctor = await User.findOne({ _id: subslot.doctor });
    //     res.locals.doctor = doctor;
    //     res.locals.patient = patient;
    //     res.locals.subslot = subslot;
    //     res.locals.appointment = appointment;
    //     appointmentDate = new Date(appointment.appointmentDate);
    //     res.locals.appointmentDate = appointmentDate.toDateString();
    //     console.log(doctor);

    // } else {
    //     res.locals.error = 'Book an appointment first';
    //     res.locals.errorType = 'Failure';
    //     if (res.locals.user.role == 'admin') res.redirect('/admin');
    //     else res.redirect('/');
    // }
}

const getCancelAppointment = async(req, res, next) => {
    const appointment = await Appointment.findOne({ _id: Mongoose.Types.ObjectId(req.params.id) });
    if (appointment) {
        const patient = await User.findOne({ _id: appointment.user });
        let subslot = await Slot.aggregate([{
                $unwind: '$subSlots'
            },
            {
                $match: { 'subSlots._id': Mongoose.Types.ObjectId(appointment.slot) }
            }

        ]);
        subslot = subslot[0];
        console.log(subslot);
        const doctor = await User.findOne({ _id: subslot.doctor });
        res.locals.doctor = doctor;
        res.locals.patient = patient;
        res.locals.subslot = subslot;
        res.locals.appointment = appointment;
        appointmentDate = new Date(appointment.appointmentDate);
        res.locals.appointmentDate = appointmentDate.toDateString();
        console.log(doctor);
        next();
    }
}

const postCancelAppointment = async(req, res, next) => {
    if (req.params.id) {
        const givenAppointment = await Appointment.findOne({ _id: Mongoose.Types.ObjectId(req.params.id) });
        givenAppointment.status = 'Cancelled';
        const appointment = await givenAppointment.save();
        var givenSubslot = await SubSlot.findOne({ _id: Mongoose.Types.ObjectId(appointment.slot) });
        givenSubslot.isBooked = false;
        givenSubslot.save()
            .then((subslot) => {
                if (subslot) {
                    if (res.locals.user.role == 'user') {

                        console.log('userType: user');
                        console.log('Cancelled');
                        res.locals.error = 'Appointment Cancelled';
                        res.locals.errorType = 'Success';
                        res.redirect('/user-dashboard-appointments');
                    } else {
                        console.log('userType: doctor');
                        res.redirect('/expert-dashboard');
                    }
                } else {
                    res.send('could not cancel appointment')
                }
            })

    } else {
        res.redirect('/user-dashboard-appointments');
    }

}

const getUserAppointments = async(req, res, next) => {
    const appointments = await Appointment.find({ user: res.locals.user._id });
    console.log('appointments: ', appointments);
    var slots = [];
    var doctors = [];
    for await (let appointment of appointments) {
        // slots = await Slot.findOne({ subSlots: { $elemMatch: { _id: Mongoose.Types.ObjectId(appointment.slot) } } }); 
        // subslot = await SubSlot.aggregate([{
        //         $unwind: '$subSlots'
        //     },
        //     {
        //         $match: { 'subSlots._id': Mongoose.Types.ObjectId(appointment.slot) }
        //     }
        // ]);
        subslot = await SubSlot.find({ _id: Mongoose.Types.ObjectId(appointment.slot) });
        console.log('found subslot: ', subslot)
        slots.push(subslot[0]);
    }
    console.log('slots: ', slots);
    for await (let subslot of slots) {
        doctor = await User.findOne({ _id: Mongoose.Types.ObjectId(subslot.doctor) });
        doctors.push(doctor);
    }
    console.log('getUserAppointments');
    console.log("slots: " + slots);

    console.log("appointments: " + typeof appointments + ": " + Array.from(appointments));
    console.log("doctors: " + doctors);
    res.locals.appointments = appointments;
    res.locals.slots = slots;
    res.locals.doctors = doctors;
    next();
}

const getAppointmentToDoctorDashboard = async(req, res, next) => {
    var doctors = await User.find({ role: 'user' });
    var token = req.headers.cookie.split('=')[1];
    var id = await utils.decryptData(token);
    var user = await User.findOne({ _id: id });
    res.locals.user = user;
    console.log('user in getAppointmentTpDoctorDashboard: ', user);
    const subslots = await SubSlot.find({ doctor: user._id, isBooked: true }, (err, docs) => {
        if (err) {
            console.log('error: ', err)
        } else {
            console.log('docs: ', docs)
        }
    });

    console.log("subslots, length: " + subslots.length + ": " + subslots);
    const bookedAppointments = [];
    const patients = [];
    for (let i = 0; i < subslots.length; i++) {
        console.log("this subslot in loop: " + subslots[i]);
        let appointment = await Appointment.findOne({ slot: Mongoose.Types.ObjectId(subslots[i]._id) }, (err, doc) => {
            if (err) {
                console.log('err: ', err)
            } else {
                console.log('found appointment: ', doc)
            }
        });
        bookedAppointments.push(appointment);
    }
    console.log('booked appointments: ', bookedAppointments)

    console.log(bookedAppointments);
    for (let i = 0; i < bookedAppointments.length; i++) {
        console.log('line 294, ', bookedAppointments[i]);
        let user = await User.findOne({ _id: Mongoose.Types.ObjectId(bookedAppointments[i].user) });
        patients.push(user);
    }
    console.log('patients: ', patients)
    console.log(patients);
    res.locals.appointments = bookedAppointments;
    res.locals.bookedSlots = subslots;
    res.locals.patients = patients;
    res.render('views/doctor_dashboard.ejs', { appointments: res.locals.appointments, doctors: doctors, slots: res.locals.bookedSlots, patients: patients })
}

const getAppointmentToAdminDashboard = async(req, res, next) => {
    const appointments = await Appointment.find();
    // const doctors = [];
    const slots = []
    const patients = [];
    const doctors = [];
    for (let i = 0; i < appointments.length; i++) {
        let slot = await SubSlot.findOne({ _id: appointments[i].slot });
        let user = await User.findOne({ _id: appointments[i].user });
        slots.push(slot)
        let doctor = await User.aggregate([{
                $lookup: {
                    from: 'slots',
                    localField: '_id',
                    foreignField: 'doctor',
                    as: 'slots'
                }
            },
            {
                $unwind: '$slots'
            },
            {
                $unwind: '$slots.subSlots'
            },
            {
                $match: { 'slots.subSlots._id': appointments[i].slot }
            }
        ]);
        doctor = doctor[0];
        doctors.push(doctor);
        patients.push(user);
    }
    for (let i = 0; i < appointments.length; i++) {
        let user = await User.findOne({ _id: appointments[i].user });
        patients.push(user);
    }
    utils.logInRed("patients: ", patients);
    console.log("doctors: " + doctors);
    console.log("appointments: ", appointments);

    var consultants = new Set(doctors);
    res.locals.consultants = Array.from(consultants);
    console.log("patinet set: ", clients);
    var clients = new Set(patients);
    res.locals.clients = Array.from(clients);
    res.locals.slots = slots;
    res.locals.appointments = appointments;
    next();
}

const getRescheduleAppointment = async(req, res, next) => {
    console.log('1');
    const appointment = await Appointment.findOne({ _id: Mongoose.Types.ObjectId(req.params.id) });
    console.log("appointment to reschedule: ", appointment);
    let subslot = await SubSlot.find({ _id: Mongoose.Types.ObjectId(appointment.slot) });
    subslot = subslot[0];
    console.log('previous subslot: ', subslot)
    const consultant = await User.findOne({ _id: subslot.doctor });
    const slots = await Slot.find({ doctor: subslot.doctor });
    console.log("doctor: " + consultant);
    console.log("slots: ", slots);
    res.locals.consultant = consultant;
    res.locals.appointment = appointment;
    res.locals.currentDay = new Date().getDay();
    res.locals.currentDate = new Date();
    res.locals.slots = slots;
    res.locals.previousSubslot = subslot;
    next();
}

const postRescheduleAppointment = async(req, res, next) => {
    // req.params.id = existing subslot
    // req.query.subslot = wanted subslot
    // setting existing subslot to false
    const oldAppointment = await Appointment.findOne({ _id: req.params.id });

    SubSlot.findOne({ _id: req.query.subslot }, async(err, firstSubslot) => {
        if (err) {
            console.log('could not fetch desired subslot: ', err);
            res.send(`could not fetch the slot you asked for`);
        } else {
            console.log('found desired subslot: ', firstSubslot)
            if (firstSubslot.isBooked === true) {
                utils.logInRed('this slot is already booked')
                res.json({ data: 'unavailable' });
                utils.logInRed('res sent')
            } else {
                utils.logInGreen('this slot not booked')
                SubSlot.findOneAndUpdate({ _id: oldAppointment.slot }, { $set: { isBooked: false } }, (err, oldSubslot) => {
                    if (err) {
                        console.log('cant set isBooked to false: ', err)
                    } else {
                        utils.logInRed('foundandUpadaeted old subslot to false');
                        SubSlot.findOne({ _id: req.query.subslot }, async(err, newSubslot) => {
                            if (err) {
                                res.send("could not find the slot you asked for");
                            } else {
                                oldAppointment.slot = newSubslot._id;
                                const newAppointment = await oldAppointment.save();
                                if (newAppointment) {
                                    newSubslot.isBooked = true;
                                    newSubslot.save()
                                        .then((updatedAppointment) => {
                                            if (updatedAppointment) {
                                                utils.logInGreen('appointment reschedules and saved');
                                                res.locals.error = "appointment rescheduled and saved";
                                                res.locals.errorType = "Success";
                                                res.json({ data: 'appointment rescheduled' });
                                            } else {
                                                res.json({ data: 'could not reschedule appointment' });
                                                utils.logInRed('could not reschedule appointment')
                                            }
                                        })
                                }
                            }
                        })

                    }
                })

            }
        }
    })

}
const getBookingStatus = (req, res, next) => {
    SubSlot.findOne({ _id: Mongoose.Types.ObjectId(req.params.id) }, async(err, subslot) => {
        if (err) {
            res.json({ data: 'could not find subslot' })
        } else {
            if (subslot) {
                if (subslot.isBooked) {
                    res.json({ data: 'unavailable' })
                } else {
                    res.json({ data: 'available' })
                }
            } else {
                res.json({ data: 'could not find subslot' })
            }
        }
    })
}
const rateAppointment = async(req, res, next) => {
    var appointment = await Appointment.findOne({ _id: req.params.id });
    var slot = await SubSlot.findOne({ _id: appointment.slot });
    var doctor = await User.findOne({ _id: slot.doctor });
    var token = req.headers.cookie.split('=')[1];
    var id = await utils.decryptData(token);
    var user = await User.findOne({ _id: id });
    appointment.rating = parseInt(req.query.rating);
    if (typeof doctor.doctor.rating !== 'number' || typeof doctor.doctor.rating == 'undefined' || doctor.doctor.rating < 1) {
        utils.logInRed('hello1')
        doctor.doctor.rating = parseInt(req.query.rating);
    } else {
        utils.logInRed('hello2')
        doctor.doctor.rating = doctor.doctor.rating + parseInt(req.query.rating);
    }
    if (typeof doctor.doctor.noOfRatings !== 'number' || typeof doctor.doctor.noOfRatings == 'undefined' || doctor.doctor.noOfRatings < 1) {
        utils.logInRed('hello3')
        doctor.doctor.noOfRatings = 1;
    } else {
        utils.logInRed('hello4')
        doctor.doctor.noOfRatings = doctor.doctor.noOfRatings + 1;
    }
    var updatedAppointment = await appointment.save();
    var updatedDoctor = await doctor.save();
    res.json({ user: user, doctor: updatedDoctor, slot: slot, appointment: updatedAppointment });
}
module.exports = {
    loadingDataOnAppointmentPage: loadingDataOnAppointmentPage,
    createAppointment: createAppointment,
    getUserAppointments: getUserAppointments,
    getAppointmentToDoctorDashboard: getAppointmentToDoctorDashboard,
    getAppointmentToAdminDashboard: getAppointmentToAdminDashboard,
    appointmentBooked: appointmentBooked,
    getCancelAppointment: getCancelAppointment,
    postCancelAppointment: postCancelAppointment,
    getRescheduleAppointment: getRescheduleAppointment,
    postRescheduleAppointment: postRescheduleAppointment,
    getBookingStatus: getBookingStatus,
    rateAppointment: rateAppointment
}