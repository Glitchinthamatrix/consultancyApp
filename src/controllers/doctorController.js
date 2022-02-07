const Doctor = require('./../models/doctorModel').Doctor;
const multer = require('multer');
const path = require('path');
const User = require('./../models/userModel');
const Category = require('./../models/cateogryModel.js');
const { GridFsStorage } = require('multer-gridfs-storage');
const dotenv = require('dotenv');
dotenv.config({ path: '../config.env' });
const mongoURI = process.env.DATABASE;
const utils = require('../utils');
const Mongoose = require('mongoose')
const doctorFileStorage = new GridFsStorage({
    url: mongoURI,
    file: (req, file) => {
        var filename = req.body.phoneNumber + path.extname(file.originalname);
        return new Promise((resolve, reject) => {
            var fileInfo = {
                filename: filename,
                bucketName: 'proof'
            };
            resolve(fileInfo)
        })
    }
});
const uploadDoctor = multer({
    storage: doctorFileStorage
}).single('display_picture');


const getallValuesApi = async() => {

    let doc = await User.find({ role: 'doctor' });
    console.log(doc);
    let location = [],
        specializations = [];

    doc.forEach(element => {

        if (element.doctor)
            element.doctor.specializations.forEach(e => {
                if (specializations.indexOf(e) == -1) {
                    specializations.push(e)
                }
            })
        if (element.doctor)
            if (location.indexOf(element.location) == -1) {
                location.push(element.location)
            }

    })

    return { specializations: specializations, location: location };

}


const valueApi = async(req, res) => {

    let values = await getallValuesApi();
    res.json(values)

}

const filter_search = async(req, res) => {

    let presentDoctorValues = await getallValuesApi();
    console.log(req.body);
    console.log('\x1b[31m%s\x1b[0m', 'gonna filter now');
    console.log('\x1b[31m%s\x1b[0m', `locations: ${presentDoctorValues.location}`);
    console.log('\x1b[31m%s\x1b[0m', `specialisations: ${presentDoctorValues.specializations}`);

    let search = req.body.search;
    if (presentDoctorValues.location.indexOf(req.body.locality) != -1) {
        console.log('\x1b[31m%s\x1b[0m', `location found in docs`);

        res.locals.filters = {
            location: [req.body.locality]
        }
        console.log('\x1b[31m%s\x1b[0m', `sent location in res.locals.filter`);
    } else if (presentDoctorValues.specializations.indexOf(search) != -1) {
        console.log('\x1b[31m%s\x1b[0m', `specialisation found in docs`);

        if (req.body.locality) {
            res.locals.filters = {
                location: [req.body.locality],
                treatment_filter: [req.body.search]
            }
            console.log('\x1b[31m%s\x1b[0m', `sent location and treatment in res.locals.filter`);
        } else {
            res.locals.filters = {
                treatment: [req.body.search]
            }
            console.log('\x1b[31m%s\x1b[0m', `sent treatment in res.locals.filter`);

        }
    } else {
        res.locals.filters = {
            location: [req.body.locality]
        }
    }
    res.locals.requestBody = req.body;
    console.log('\x1b[31m%s\x1b[0m', `sent res.locals`);

    res.redirect("/experts")
}

const getAllDoctors = async(req, res, next) => {
    utils.logInRed('in getAllDictors: ', res.locals.doctors)

    var doctors = [];

    if (Object.keys(req.body).length > 0) {

        console.log('\x1b[31m%s\x1b[0m', `req body present`, req.body);
        if (Object.keys(req.body).length) {
            if (req.headers.cookie) {
                var token = req.headers.cookie.split('=')[1];
                var id = utils.decryptData(token);
                var user = await User.findOne({ _id: Mongoose.Types.ObjectId(id) });
                res.locals.user = user;
            }
            //presentDoctorValues = await correctedArray(presentDoctorValues, res.locals.filters)
            var unfiltered = await User.find({ role: 'doctor' });
            //filtering based on type of consultant
            if (req.body.consultantType) {
                unfiltered.forEach((consultant) => {
                    if (consultant.doctor.cateogry.replace(/\s/g, "").toLowerCase() == req.body.consultantType.replace(/\s/g, "").toLowerCase() || consultant.doctor.specializations.map(v => v.toLowerCase()).includes(req.body.consultantType) || consultant.doctor.keywords.map(v => v.toLowerCase()).includes(req.body.consultantType)) {
                        doctors.push(consultant);
                    }
                })
            }
            //filtering based on location
            if (req.body.location) {
                if (doctors.length > 0) {
                    doctors.forEach((consultant) => {
                        if (consultant.location.toLowerCase() === req.body.location.toLowerCase()) {
                            doctors.push(consultant);
                        }
                    })
                } else {
                    unfiltered.forEach((consultant) => {
                        if (consultant.location.toLowerCase() === req.body.location.toLowerCase()) {
                            doctors.push(consultant);
                        }
                    })
                }
            }
            //filtering based on experience
            if (req.body.experience) {
                if (doctors.length > 0) {
                    doctors.forEach((consultant) => {
                        if (req.body.experience - consultant.doctor.experience <= 2) {
                            doctors.push(consultant);
                        }
                    })
                } else {
                    unfiltered.forEach((consultant) => {
                        if (req.body.experience - consultant.doctor.experience <= 2) {
                            doctors.push(consultant);
                        }
                    })
                }
            }
            //filtering based on fees
            if (req.body.maxFees) {
                if (doctors.length > 0) {
                    doctors.forEach((consultant) => {
                        if (consultant.doctor.avg_fees - req.body.maxFees <= 1000) {
                            doctors.push(consultant);
                        }
                    })
                } else {
                    unfiltered.forEach((consultant) => {
                        if (consultant.doctor.avg_fees - req.body.maxFees <= 1000) {
                            doctors.push(consultant);
                        }
                    })
                }
            }
            doctors.forEach((doc) => {
                console.log(doc._id, ": ", typeof doc.doctor)
            })
            var doctorSet = new Set(doctors);
            doctors = Array.from(doctorSet);
            if (req.body.sort) {
                if (req.body.sort === 'feeHighToLow') {
                    utils.logInGreen('fee high to low')
                    var done = false;
                    while (!done) {
                        done = true;
                        for (let i = 1; i < doctors.length; i++) {
                            if (doctors[i - 1].doctor.avg_fees < doctors[i].doctor.avg_fees) {
                                done = false;
                                var tmp = doctors[i - 1];
                                doctors[i - 1] = doctors[i];
                                doctors[i] = tmp;
                            }
                        }
                    }
                    doctors = doctors;
                } else if (req.body.sort === 'feeLowToHigh') {
                    utils.logInGreen('fee low to high')
                    var done = false;
                    while (!done) {
                        done = true;
                        for (let i = 1; i < doctors.length; i++) {
                            if (doctors[i - 1].doctor.avg_fees > doctors[i].doctor.avg_fees) {
                                done = false;
                                var tmp = doctors[i - 1];
                                doctors[i - 1] = doctors[i];
                                doctors[i] = tmp;
                            }
                        }
                    }
                    doctors = doctors;
                } else if (req.body.sort === 'experienceHighToLow') {
                    utils.logInGreen('exp high to low')
                    var done = false;
                    while (!done) {
                        done = true;
                        for (let i = 1; i < doctors.length; i++) {
                            if (doctors[i - 1].doctor.experience < doctors[i].doctor.experience) {
                                done = false;
                                var tmp = doctors[i - 1];
                                doctors[i - 1] = doctors[i];
                                doctors[i] = tmp;
                            }
                        }
                    }
                    doctors = doctors;
                } else {
                    doctors = doctors;
                }
            }
            res.locals.doctors = doctors;
            res.locals.expert = req.body.consultantType;
            res.locals.location = req.body.location;
        } else {
            res.render('views/doctor.ejs', { doctors: [], errorType: 'Failure', error: 'Please fill in the filter values' })
        }

    } else {
        var doctors = await User.find({ role: 'doctor' });
        if (req.headers.cookie) {
            var token = req.headers.cookie.split('=')[1];
            var id = utils.decryptData(token);
            var user = await User.findOne({ _id: Mongoose.Types.ObjectId(id) });
            res.locals.user = user;
        }
        res.locals.doctors = doctors;
    }

    res.locals.currentDay = new Date().getDay();
    res.locals.currentDate = new Date();
    //res.locals.allFilters = presentDoctorValues;
    if (req.body) {
        console.log('\x1b[31m%s\x1b[0m', `requested body`, req.body);
        res.locals.requestBody = req.body;
    }
    console.log('session filters', res.locals.filters);
    console.log('user: ', res.locals.user);
    utils.logInRed('doctors in res.locals: ', res.locals.doctors)
    next();
}


const filterDoctor = async(req, res, next) => {
    const doctors = await Doctor.find(req.query);
    res.locals.doctors = doctors;
    next();
}

const addDoctor = async(req, res, next) => {
    uploadProof(req, res, async(err) => {
        console.log('uploading doctor');
        if (err) {
            console.log('error in adding doctor')
            res.locals.error = err;
            res.locals.errorType = 'Failure';
            res.redirect('/add-doctors');
        } else {
            console.log("req.file from uploadDoctor: " + req.file);
            let hospitals = req.body.hospitalList.slice(1, req.body.hospitalList.length - 1).split(',');
            let achievementList = req.body.achievements.slice(1, req.body.achievements.length - 1).split(',');
            let qualificationList = req.body.qualifications.slice(1, req.body.qualifications.length - 1).split(',');
            let awardsList = req.body.awards.slice(1, req.body.awards.length - 1).split(',');
            let specializationsList = req.body.specializations.slice(1, req.body.specializations.length - 1).split(',');
            let hospitalList = [];
            let achievements = [];
            let qualifications = [];
            let awards = [];
            let specializations = [];
            if (req.body.hospitalList) {
                for (let i = 0; i < hospitals.length; i++) {
                    value = JSON.parse(hospitals[i]).value;
                    hospitalList.push(value);
                }
            }
            for (let i = 0; i < achievementList.length; i++) {
                value = JSON.parse(achievementList[i]).value;
                achievements.push(value);
            }
            if (req.body.awards) {
                for (let i = 0; i < awardsList.length; i++) {
                    value = JSON.parse(awardsList[i]).value;
                    awards.push(value);
                }
            }
            for (let i = 0; i < qualificationList.length; i++) {
                value = JSON.parse(qualificationList[i]).value;
                qualifications.push(value);
            }
            for (let i = 0; i < specializationsList.length; i++) {
                value = JSON.parse(specializationsList[i]).value;
                specializations.push(value);
            }
            const newDoctor = await User.create({
                role: 'doctor',
                name: req.body.name,
                gender: req.body.gender,
                dob: req.body.dob,
                location: req.body.location,
                display_picture: '/image/' + req.file.originalname,
                email: req.body.email,
                password: req.body.password,
                phoneNumber: req.body.phoneNumber,
                doctor: {
                    specializations: specializations,
                    qualifications: qualifications,
                    awards: awards,
                    avg_fees: req.body.averageFees,
                    hospitalList: hospitalList,
                    achievements: achievements,
                    experience: req.body.experience,
                    description: req.body.description,
                }
            });
            res.locals.error = 'Doctor Registered Succesfully!';
            res.locals.errorType = 'Success';
            res.redirect('/add-doctors');
        }
    })
}

// const manuallyPopulateDoctor = async (req, res, next) => {
//     var hospitals = [];
//     for await (hospitalid of res.locals.user.doctor.hospitalList){
//         let hospital = await Hospital.findOne({ _id: hospitalid }, {name: 1});
//         hospitals.push(hospital.name);
//     }
//     res.locals.user.doctor.hospitalList = hospitals;
//     next();
// }

const deleteDoctor = async(req, res, next) => {
    utils.logInRed('deleting ', req.params.id);
    User.remove({ _id: req.params.id })
        .then((resp) => {
            console.log('deleted ', req.params.id)
            console.log(resp)
        })
    res.locals.error = 'Doctor deleted successfully';
    res.locals.errorType = 'Success';
    res.redirect('/admin-experts');

}

const doctorFilters = (req, res) => {
    res.locals.filters = req.body;
    res.redirect('/experts');
}

const doctorSort = (req, res) => {
    res.locals.sortBy = req.body.sort;
    res.redirect('/experts');
}

const getDoctor = async(req, res, next) => {
    const doctor = await User.findOne({ _id: Mongoose.Types.ObjectId(req.params.id) });
    res.locals.doctor = doctor;
    next();
}

const adminEditDoctor = (req, res, next) => {
    uploadDoctor(req, res, async(err) => {
        if (err) {
            res.locals.error = err;
            res.locals.errorType = 'Failure';
            res.redirect('/admin-edit-doctor');
        } else {
            const user = await User.findOne({ email: req.body.email });
            // console.log(req.body);
            user.display_picture = typeof req.file != 'undefined' && req.file ? '/image/' + user.phoneNumber + path.extname(req.file.originalname) : user.display_picture;
            user.name = req.body.name;
            user.phoneNumber = req.body.phoneNumber;
            user.email = req.body.email;
            user.gender = req.body.gender;
            user.dob = req.body.dob;
            user.bloodGroup = req.body.bloodGroup;
            user.timeZone = req.body.timeZone;
            user.state = req.body.state;
            user.country = req.body.country;
            user.location = req.body.location;
            let achievementList = req.body.achievements.slice(1, req.body.achievements.length - 1).split(',');
            let qualificationList = req.body.qualifications.slice(1, req.body.qualifications.length - 1).split(',');
            let awardsList = req.body.awards.slice(1, req.body.awards.length - 1).split(',');
            let specializationsList = req.body.specializations.slice(1, req.body.specializations.length - 1).split(',');

            let achievements = [];
            let qualifications = [];
            let awards = [];
            let specializations = [];

            for (let i = 0; i < achievementList.length; i++) {
                value = JSON.parse(achievementList[i]).value;
                achievements.push(value);
            }
            if (req.body.awards) {
                for (let i = 0; i < awardsList.length; i++) {
                    value = JSON.parse(awardsList[i]).value;
                    awards.push(value);
                }
            }
            for (let i = 0; i < qualificationList.length; i++) {
                value = JSON.parse(qualificationList[i]).value;
                qualifications.push(value);
            }
            for (let i = 0; i < specializationsList.length; i++) {
                value = JSON.parse(specializationsList[i]).value;
                specializations.push(value);
            }

            user.doctor = {
                description: req.body.description,
                achievements: achievements,
                experience: req.body.experience,
                qualifications: qualifications,
                awards: awards,
                cateogry: req.body.cateogry,
                specializations: specializations,
                avg_fees: req.body.averageFees,
            }
            await user.save();
            res.locals.error = 'Doctor Profile Updated';
            res.locals.errorType = 'Success';
            res.redirect(`/admin-edit-doctor/${user._id}`);
        }
    })
}


module.exports = {
    getAllDoctors: getAllDoctors,
    addDoctor: addDoctor,
    deleteDoctor: deleteDoctor,
    // manuallyPopulateDoctor: manuallyPopulateDoctor,
    doctorFilters: doctorFilters,
    doctorSort: doctorSort,
    getDoctor: getDoctor,
    adminEditDoctor: adminEditDoctor,
    filter_search: filter_search,
    getSearch: valueApi
        // getCateogry: getCateogry
}