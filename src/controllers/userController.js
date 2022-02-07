const User = require('./../models/userModel');
const multer = require('multer');
const path = require('path');
const Doctor = require('./../models/doctorModel');
const Nexmo = require('nexmo');
const dotenv = require('dotenv');
dotenv.config({ path: '../config.env' });
const utils = require('../utils');
const Mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const { GridFsStorage } = require('multer-gridfs-storage');
const mongoURI = process.env.DATABASE;
const authenticationController = require('./authenticationController.js')
const uploadUser = authenticationController.uploadUser;
const nexmo = new Nexmo({
    apiKey: process.env.NEXMO_API_KEY,
    apiSecret: process.env.NEXMO_API_SECRET
});
let proofGFS;
var createConnection = async() => {
    const mongoURI = "mongodb+srv://Nitesh:mayday9501@ecommerceweb.efse8.mongodb.net/PROJECT0?retryWrites=true&w=majority";
    var connect = await Mongoose.createConnection(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    if (!connect) {
        console.log('createConnection err: ', err.message)
    } else {
        console.log('DB connection for proofGFS bucket established')
        proofGFS = new Mongoose.mongo.GridFSBucket(connect.db, { bucketName: 'proof' }, (err) => {
            if (err) {
                console.log('gridFSBucket not connected')
            } else {
                console.log('gridFSBucket connected')
            }
        })
    }
}
createConnection();

const getExpertiseProof = (req, res, next) => {
    var filename = req.params.filename;
    proofGFS.openDownloadStreamByName(filename).pipe(res);
}
const proofFileStorage = new GridFsStorage({
    url: mongoURI,
    file: async(req, file) => {
        var token = req.headers.cookie.split('=')[1];
        var id = utils.decryptData(token);
        var user = await User.findOne({ _id: Mongoose.Types.ObjectId(id) });
        if (!user || typeof user == "undefined") {
            res.json("could not find your profile")
        }
        var filename;
        // console.log('filename is set to ', user.phoneNumber + path.extname(file.originalname))
        console.log('\x1b[31m%s\x1b[0m', 'filename is set to ', user.phoneNumber, path.extname(file.originalname));
        if (file && user) {
            filename = user._id + path.extname(file.originalname);
        } else if (req.url.includes('save-changes') && file) {
            proofGFS.deleteOne({ filename: user.doctor.proof }, (err, result) => {
                if (err) {
                    res.json('could not delete your old proof image')
                } else {
                    utils.logInGreen('deletde old proof image')
                }
            })
            filename = user.doctor.proof;
        } else {
            rse.json('could not name this image');
        }
        return new Promise((resolve, reject) => {
            var fileInfo = {
                filename: filename,
                bucketName: 'proof'
            };
            resolve(fileInfo)
        })
    }
});

const uploadProof = multer({
    storage: proofFileStorage,
    fileFilter: function(req, file, cb) {
        // if (req.url.includes('/save-changes')) {
        //     console.log('setting the same name of pic again ' + req.query.curr_display_picture ? req.query.curr_display_picture : 'not a replcement request')
        //     gfs.find({ filename: req.query.curr_display_picture }).toArray((err, files) => {
        //         if (err) {
        //             console.log('\x1b[31m%s\x1b[0m', "error occured in finding the image to replace: ", err)
        //         } else {
        //             console.log('\x1b[31m%s\x1b[0m', 'found files running the loop to find the one to delete: ', files)
        //             gfs.delete(new Mongoose.Types.ObjectId(files[0]._id), (err, data) => {
        //                 if (err) {
        //                     next(err);
        //                 } else {
        //                     // console.log('file filtered for real')
        //                     file.originalname = req.query.curr_display_picture;
        //                     console.log('\x1b[31m%s\x1b[0m', 'new name is the originalname: ', req.query.curr_display_picture)
        //                     return cb(null, true);
        //                 }
        //             })
        //         }
        //     })
        // } else {
        console.log('dont need to filter, sending ahead')
        return cb(null, true);
        // }
    }
}).single('proof');


const addDoctorDetails = (req, res, next) => {
    uploadProof(req, res, async(err) => {
        if (err) {
            res.send(`error in adding doctorDetails ${err.message}`);
        } else {
            console.log('found cookie in addDoctorDetails: ', req.headers.cookie);
            var token = req.headers.cookie.split('=')[1];
            console.log('token found after splitting cookie: ', token)
            var id = utils.decryptData(token);
            console.log('found id: ', id);
            const user = await User.findOne({ _id: id });
            var today = new Date();
            // let hospitals = req.body.hospitalList.slice(1, req.body.hospitalList.length - 1).split(',');
            let proofFiles = req.files;
            if (proofFiles) {
                console.log('proofFiles: ', proofFiles);
            } else {
                console.log('didnt find req.files: ', req.files)
            }
            let achievementList = req.body.achievements.slice(1, req.body.achievements.length - 1).split(',');
            let qualificationList = req.body.qualifications.slice(1, req.body.qualifications.length - 1).split(',');
            let awardsList = req.body.awards.slice(1, req.body.awards.length - 1).split(',');
            let specializationsList = req.body.specializations.slice(1, req.body.specializations.length - 1).split(',');
            let keywordsList = req.body.keywords.slice(1, req.body.keywords.length - 1).split(',');
            // let slotDurationString = req.body.slotDuration.slice(1,req.body.slotDuration.length - 1).split(',');
            let hospitalList = [];
            let achievements = [];
            let qualifications = [];
            let awards = [];
            let specializations = [];
            let keywords = [];
            let cateogry = req.body.cateogry.toString();

            for (let i = 0; i < achievementList.length; i++) {
                value = JSON.parse(achievementList[i]).value;
                achievements.push(value);
            }
            if (keywordsList.length > 0 && keywordsList[0] !== '') {
                console.log('keywords length is: ', keywordsList.length);
                console.log(keywordsList)
                for (let i = 0; i < keywordsList.length; i++) {
                    value = JSON.parse(keywordsList[i]).value;
                    keywords.push(value);
                }
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

            if (!req.headers.cookie) {
                res.send('found no cookies to extract doctor._id')
            } else {
                user.doctor = {
                    description: req.body.description,
                    achievements: achievements,
                    experience: req.body.experience,
                    qualifications: qualifications,
                    awards: awards,
                    cateogry: cateogry,
                    keywords: keywords,
                    specializations: specializations,
                    avg_fees: req.body.averageFees,
                    hospitalList: hospitalList,
                    proof: user._id + path.extname(req.file.originalname) ? user._id + path.extname(req.file.originalname) : user.doctor.proof
                }
                await user.save();
                console.log("created new user", user);
                next();
            }
        }
    })
}


const editProfile = (req, res, next) => {
    uploadUser(req, res, async(err) => {
        if (err) {
            // res.locals.error = err;
            // res.locals.errorType = 'Failure';
            // res.redirect('/edit-profile');
            res.json({ uploadExpertError: err })
        } else {
            var token = req.headers.cookie.split('=')[1];
            var id = utils.decryptData(token);

            const user = await User.findOne({ _id: Mongoose.Types.ObjectId(id) });
            // res.json({
            //     user: user,
            //     space: 'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
            //     reqBody: req.body
            // })
            var DP;
            if (typeof req.file != 'undefined' && req.file && !req.url.includes('save-changes')) {
                DP = user.phoneNumber + path.extname(req.file.originalname)
            } else if (req.url.includes('save-changes')) {
                DP = user.display_picture;
            }
            user.display_picture = DP;
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
            if (user.role === 'doctor') {
                let achievementList = req.body.achievements.slice(1, req.body.achievements.length - 1).split(',');
                let qualificationList = req.body.qualifications.slice(1, req.body.qualifications.length - 1).split(',');
                let awardsList = req.body.awards.slice(1, req.body.awards.length - 1).split(',');
                let specializationsList = req.body.specializations.slice(1, req.body.specializations.length - 1).split(',');
                let keywordsList = req.body.keywords.slice(1, req.body.keywords.length - 1).split(',');
                let achievements = [];
                let qualifications = [];
                let awards = [];
                let specializations = [];
                let keywords = [];

                for (let i = 0; i < achievementList.length; i++) {
                    value = JSON.parse(achievementList[i]).value;
                    achievements.push(value);
                }
                for (let i = 0; i < keywordsList.length; i++) {
                    value = JSON.parse(keywordsList[i]).value;
                    keywords.push(value);
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
                    cateogry: req.body.cateogry.toString(),
                    keywords: keywords,
                    specializations: specializations,
                    avg_fees: req.body.averageFees,
                    proof: user.doctor.proof
                }
                await user.save();
                res.locals.user = user;
                res.locals.error = 'Profile Updated';
                res.locals.errorType = 'Success';
                res.redirect('/edit-profile-expert');
            } else {
                await user.save();
                res.locals.user = user;
                res.locals.error = 'Profile Updated';
                res.locals.errorType = 'Success';
                res.redirect('/edit-profile');
            }
        }
    })
}


const changePhoneNumber = (req, res, next) => {

    const nexmoRequestOTPCallback = (err, result) => {
        if (err) {
            res.status(400).json({
                status: 'error',
                message: 'Please come back later.'
            })
        } else {
            res.locals.request_id = result.request_id;
            res.locals.phoneNumber = req.body.phoneNumber;
            console.log('Requesting OTP');
            console.log(res.locals.request_id);
            res.locals.error = 'Valid Only for 60 Secs';
            res.locals.errorType = 'Info';
            res.status(200).json({
                status: 'success',
            });
        }
    }


    nexmo.verify.request({
        number: '91' + req.body.phoneNumber,
        brand: 'solvent',
        code_length: '4',
        workflow_id: '6',
        pin_expiry: '120'
    }, nexmoRequestOTPCallback);

}

const changePhoneNumberOTPVerify = (req, res, next) => {

    const nexmoVerifyCallback = (err, result) => {
        if (err) {
            res.locals.errorType = 'Failure';
            res.locals.error = 'Please try again after some time.';
            res.status(400).json({
                status: 'error',
                message: 'Error'
            });
        } else {
            if (result.error_text == 'The code provided does not match the expected value') {
                res.locals.errorType = 'Failure';
                res.locals.error = 'Incorrect OTP';
                res.status(400).json({
                    status: 'error',
                    message: 'Incorrect OTP'
                });
            } else {
                const user = User.findOne({ email: res.locals.user.email });
                user.phoneNumber = res.locals.phoneNumber;
                user.save();
                res.locals.errorType = 'Success';
                res.locals.error = 'Phone Number Changed';
                res.locals.userId = res.locals.user._id;
                res.locals.request_id = null;
                res.locals.save();
                res.redirect('/edit-profile');
                // console.log(res.locals);
            }
        }
    }


    req.body.otp = `${req.body.otp_1 + req.body.otp_2 + req.body.otp_3 + req.body.otp_4}`;
    nexmo.verify.check({
        request_id: res.locals.request_id,
        code: req.body.otp
    }, nexmoVerifyCallback);

}


const settings = async(req, res) => {
    var token = req.headers.cookie.split('=')[1];
    var id = await utils.decryptData(token);
    if (req.body.new_password === req.body.confirm_password) {
        var user = await User.findOne({ _id: Mongoose.Types.ObjectId(id) });
        var valid = await bcrypt.compare(req.body.curr_password, user.password);
        console.log('isValid? ', valid);
        if (valid) {
            user.password = req.body.new_password;
            user.save()
                .then((user) => {
                    if (user) {
                        res.send('changed')

                    } else {
                        res.send('not changed')
                    }
                })
        } else {
            res.send('incorrect current password')
        }
    } else {
        res.send('passwords do not match')
    }
}

const getAllUsers = async(req, res, next) => {
    const users = await User.find({ role: 'user' });
    res.locals.users = users;
    next();
}

module.exports = {
    editProfile: editProfile,
    addDoctorDetails: addDoctorDetails,
    changePhoneNumber: changePhoneNumber,
    changePhoneNumberOTPVerify: changePhoneNumberOTPVerify,
    settings: settings,
    getAllUsers: getAllUsers,
    getExpertiseProof: getExpertiseProof
}