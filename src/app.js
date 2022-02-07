const express = require('express');
const ejs = require('ejs');
const fs = require('fs');
const bcrypt = require('bcrypt');
const path = require('path');
const multer = require('multer');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const session = require('express-session');
const authenticationController = require('./controllers/authenticationController');
const userController = require('./controllers/userController');
const doctorController = require('./controllers/doctorController');
const appointmentController = require('./controllers/appointmentController');
const slotController = require('./controllers/slotController');
const Filestore = require('session-file-store')(session);
const utils = require('./utils')
const User = require('./models/userModel');
const Doctor = require('./models/doctorModel');
const Cateogry = require('./models/cateogryModel');
const Cateogries = require('./models/cateogryModel');
const Mongoose = require('mongoose');
const mongoURI = process.env.DATABASE;
const Slot = require('./models/slotModel')
const bodyParser = require('body-parser')

// Middlewares
app = express();
var server = require('http').createServer(app);
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('views', __dirname);
app.use(express.static(path.join(__dirname)));

// Public Folder
app.use(express.static(path.join(__dirname, '/public')));

// EJS
app.engine('html', ejs.renderFile);
app.set('view engine', 'ejs');


function shuffleArray(array) {
    let currentIndex = array.length,
        randomIndex;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]
        ];
    }

    return array;
}

const redirectToRespectiveHome = (req, res, next) => {
        if (req.headers.cookie) {
            console.log('found cookie on GET /email-login: ', req.headers.cookie);
            var token = req.headers.cookie.split('=')[1];
            var id = utils.decryptData(token);
            User.findOne({ _id: id })
                .then((user) => {
                    if (user) {
                        user.role === 'admin' ? res.redirect('/admin') : res.redirect('/')
                    } else {
                        console.log('no cookie found on GET /email-login, rendering email-login.ejs')
                        res.render('views/email-login.ejs')
                    }
                })
        } else {
            res.render('views/email-login.ejs')
        }
    }
    //setting the gfs operator 
let gfs;
let GFSForProofOfWork;
var createConnection = async() => {
    const mongoURI = process.env.DATABASE;
    var connect = await Mongoose.createConnection(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    if (!connect) {
        console.log('createConnection err: ', err.message)
    } else {
        console.log('DB connection for gridFS bucket established')
        gfs = new Mongoose.mongo.GridFSBucket(connect.db, { bucketName: 'consultants' }, (err) => {
            if (err) {
                console.log('gridFSBucket not connected')
            } else {
                console.log('gridFSBucket connected')
            }
        })
    }
}
var createConnectionForProofOfWork = async() => {
    const mongoURI = process.env.DATABASE;
    var connect = await Mongoose.createConnection(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    if (!connect) {
        console.log('createConnectionForProofOfWork err: ', err.message)
    } else {
        console.log('DB connection for gridFS bucket established')
        GFSForProofOfWork = new Mongoose.mongo.GridFSBucket(connect.db, { bucketName: 'proofOfWork' }, (err) => {
            if (err) {
                console.log('gridFSBucket.proofOfWork not connected')
            } else {
                console.log('gridFSBucket.proofOfWork connected')
            }
        })
    }
}
createConnection();
createConnectionForProofOfWork();
// Authentication Routes

app.get('/email-login', redirectToRespectiveHome, authenticationController.checkOnboarding);
app.get('/image/:filename', (req, res, next) => {
    gfs.find({ filename: req.params.filename }).toArray((err, files) => {
        if (err) {
            console.log('\x1b[31m%s\x1b[0m', 'could not find image');
        }
        gfs.openDownloadStreamByName(req.params.filename).pipe(res);
    })
})

app.get('/profile/:filename', authenticationController.getUserProfilePicture)
app.get('/user-profile', authenticationController.redirectLogin, async(req, res) => {
    var token = req.headers.cookie.split('=')[1];
    var id = await utils.decryptData(token);
    utils.logInGreen('token: ', token + "; " + "id: ", id)
    User.findOne({ _id: Mongoose.Types.ObjectId(id) })
        .then((user) => {
            if (user) {
                console.log('found user;: ', user)
                res.render('views/user-profile.ejs', { user: user })
            } else {
                console.log("user not found")
                res.redirect('/email-login.ejs', { errorType: 'Failure', error: "Your account was not found, signup if you don't have an account" })
            }
        })
        .catch((err) => { utils.logInRed("error in getUserProfile: " + err.message) })
})
app.post('/user-profile', authenticationController.redirectLogin, authenticationController.editUserProfile);
app.post('/email-login', async(req, res) => {
    if (req.body.email && req.body.password) {
        const user = await User.findOne({ email: req.body.email });
        if (user) {
            const passwordCorrect = await bcrypt.compare(req.body.password, user.password); /* await user.comparePassword(req.body.password, user.password);*/
            if (passwordCorrect) {
                var now = new Date();
                var time = now.getTime();
                time += 3600 * 1000;
                now.setTime(time);
                var cookie = utils.encryptData(user._id.toString());
                res.cookie(user.role, cookie, { secure: true, httpOnly: true, expires: now });
                authenticationController.sendMail(user.email, 'You logged in your account')
                res.locals.user = user;
                res.redirect('/')
            } else {
                const errorType = 'Failure';
                const error = "Incorrect Password."
                res.render('views/email-login.ejs', { errorType: errorType, error: error, expires: now });
            }
        } else {
            const errorType = 'Failure';
            const error = "Email Not Registered"
            res.render('views/email-login.ejs', { errorType: errorType, error: error });
        }
    }
});

app.get('/getCateogries', async(req, res) => {
    var cateogries = [];
    var catData = await Cateogries.find({});
    console.log('catData: ', catData)
    catData.forEach((cat) => {
        cateogries.push(cat.cateogry);
    });
    res.json({ categories: cateogries });
})
app.get('/addCateogry', authenticationController.checkAdmin, async(req, res, next) => {
    var cateogries = [];
    var catData = await Cateogries.find({});
    console.log('catData: ', catData)
    catData.forEach((cat) => {
        cateogries.push(cat.cateogry);
    });
    res.render("views/cateogries", { cateogries: cateogries });
});
app.post('/addCateogry', async(req, res, next) => {
    var cateogries = [];
    var catData = await Cateogries.find({});
    console.log('catData: ', catData)
    catData.forEach((cat) => {
        cateogries.push(cat.cateogry);
    });
    var newCateogry = req.body.cateogry.trim();
    console.log('new cateogry: ', newCateogry);
    // res.json({ cateogries: cateogries })
    if (cateogries.includes(newCateogry)) {
        res.send('this cateogry is already added')
    } else {
        var cat = await Cateogries.create({ cateogry: newCateogry });
        res.send(`cateogry "${cat.cateogry}" added successfully`)
    }
})

app.post('/removeCateogry', async(req, res, next) => {
    var cateogries = [];
    var catData = await Cateogries.find({});
    console.log('catData: ', catData)
    catData.forEach((cat) => {
        cateogries.push(cat.cateogry);
    });
    var newCateogry = req.body.cateogry.trim();
    console.log('new cateogry: ', newCateogry);
    // res.json({ cateogries: cateogries })
    if (!cateogries.includes(newCateogry)) {
        res.send('this cateogry doesnt exist')
    } else {
        var resp = await Cateogries.remove({ cateogry: newCateogry });
        res.send(`${resp.n} cateogry deleted successfully`)
        console.log('deleted: ', cat);
    }
})
app.get('/getSlots/:doctorId', authenticationController.redirectLogin, async(req, res) => {
    var currentDate = new Date();
    User.find({ role: 'doctor' })
        .then(async(consultants) => {
            if (consultants) {
                console.log('found consultants: ', consultants);
                var otherConsultants = [];
                var consultant = consultants.filter((consultant) => {
                    return consultant._id == req.params.doctorId
                });
                var keywords = consultant[0].doctor.keywords;
                var specializations = consultant[0].doctor.specializations;
                var cateogry = consultant[0].doctor.cateogry;
                console.log('cateogry: ', cateogry)
                consultants.forEach((consultant) => {
                    consultant.doctor.specializations.forEach((specialization) => {
                        if (specializations.map(v => v.toLowerCase()).includes(specialization.toLowerCase())) {
                            otherConsultants.push(consultant)
                        }
                    })
                    if (consultant.doctor.cateogry.toLowerCase().replace(/\s/g, "") == cateogry.toLowerCase().replace(/\s/g, "")) {
                        otherConsultants.push(consultant)
                    }
                    consultant.doctor.keywords.forEach((keyword) => {
                        if (keywords.map(v => v.toLowerCase()).includes(keyword.toLowerCase())) {
                            otherConsultants.push(consultant);
                        }
                    })
                    consultant.doctor.specializations.forEach((specialization) => {
                        if (keywords.map(v => v.toLowerCase()).includes(specialization.toLowerCase())) {
                            otherConsultants.push(consultant)
                        }
                    })
                    consultant.doctor.keywords.forEach((keyword) => {
                        if (specializations.map(v => v.toLowerCase()).includes(keyword.toLowerCase())) {
                            otherConsultants.push(consultant);
                        }
                    })
                });
                otherConsultants = new Set(otherConsultants);
                otherConsultants = Array.from(otherConsultants);
                var index = otherConsultants.indexOf(consultant);
                otherConsultants = otherConsultants.splice(index, 1);
                console.log('others: ', otherConsultants);
                var slots = await Slot.find({ doctor: Mongoose.Types.ObjectId(req.params.doctorId) });
                var todaysDate = new Date();
                var today = todaysDate.getDay();
                var theseSlots = await slots.filter((slot) => {
                    utils.logInRed('slot with id ', slot._id);
                    var week = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                    var slotDate;
                    utils.logInRed('dates: ' + week.indexOf(slot.days[0]) + " :" + today);
                    if (week.indexOf(slot.days[0]) < today) {
                        var difference = 7 - (today) + week.indexOf(slot.days[0]);
                        utils.logInRed(`7 - ${(today)} + ${(today)}`)
                        console.log('difference: ', difference)
                        const d = new Date();
                        let day = d.getDate();
                        d.setDate(d.getDate() + difference);
                        console.log('date ' + d);
                        slot.slotDate = d;
                    } else if (week.indexOf(slot.days[0]) > today) {
                        var difference = week.indexOf(slot.days[0]) - (today);
                        slotDate = todaysDate.setDate(todaysDate + difference);
                        console.log('difference: ', difference)
                        const d = new Date();
                        let day = d.getDate();
                        d.setDate(d.getDate() + difference);
                        console.log('date ' + d);
                        slot.slotDate = d;
                    } else {
                        const d = new Date();
                        slot['slotDate'] = d;
                        console.log('set the same day');
                    }
                    return slot;
                })
                console.log('found consultant: ', consultant);
                utils.logInRed('others: ', otherConsultants);
                console.log('found slots: ', slots);
                // res.json({ mainConsultant: consultant[0], otherConsultants: otherConsultants });
                res.render('views/userdetail.ejs', { currentDate: currentDate, consultant: consultant[0], otherConsultants: otherConsultants, slots: theseSlots });
            } else {
                console.log('didnt find consultant');
            }
        })
});
// app.get('/phone-login', authenticationController.checkCancel, authenticationController.redirectToRespectiveHome, (req, res) => {
//     res.render('views/phone-login.ejs', { error: res.locals.error || '', session: res.locals, errorType: res.locals.errorType });
//     res.locals.error = "";
// });

//app.post('/phone-login', authenticationController.redirectToRespectiveHome, authenticationController.phoneLogin);

app.get('/edit-profile-expert', authenticationController.redirectLogin, authenticationController.redirectAdmin, (req, res) => {

    res.render('views/edit_profile_doctor.ejs', { user: res.locals.user, error: res.locals.error, errorType: res.locals.errorType, rates: res.locals.rates ? res.locals.rates : res.locals.user.doctor.rates });
})
app.get('/signup', authenticationController.redirectIfCookie, (req, res) => {
    res.render('views/signup.ejs', { error: false, errorType: false });
});

app.post('/signup', authenticationController.redirectIfCookie, authenticationController.signUp);

app.get('/expert-onboarding', authenticationController.onBoardingDone);

app.get('/otp', (req, res) => {
    res.render('views/otp.ejs', { error: res.locals.error, session: res.locals, errorType: res.locals.errorType });
})

app.post('/otp', authenticationController.checkOTP, authenticationController.redirectToRespectiveHome);

app.put('/resend-otp', authenticationController.cancelOldOTP);



app.post('/forgot-password', authenticationController.checkIfUserExists, authenticationController.phoneLogin)

app.get('/create-new-password', authenticationController.redirectToRespectiveHome, (req, res) => {
    res.render('views/create_new_password.ejs', { error: res.locals.error, session: res.locals, errorType: res.locals.errorType });
})

app.post('/create-new-password', authenticationController.changePassword);

app.get('/logout', (req, res) => {
    console.log('insilde logout route');
    var token = req.headers.cookie.split('=')[1];
    var id = utils.decryptData(token);
    User.findOne({ _id: id })
        .then((user) => {
            console.log('found user');
            if (user) {
                if (user.role === 'admin') {
                    res.clearCookie('admin');

                    console.log('cleared cookie')
                    res.redirect('/email-login');
                } else if (user.role === 'user') {
                    res.clearCookie('user');

                    console.log('cleared cookie')
                    res.redirect('/email-login');
                } else if (user.role === 'doctor') {
                    res.clearCookie('doctor');

                    console.log('cleared cookie')
                    res.redirect('/email-login');
                }
            } else {
                res.send('could not logout')
            }
        })
        // res.clearCookie('doctor');
        // res.send('clear cookie');
});

// Admin Routes

app.get('/admin', authenticationController.redirectLogin, authenticationController.checkAdmin, appointmentController.getAppointmentToAdminDashboard, (req, res) => {
    res.render('views/dashboard.ejs', { error: res.locals.error, slots: res.locals.slots, errorType: res.locals.errorType, clients: res.locals.clients, consultants: res.locals.consultants, appointments: res.locals.appointments });
});

app.get('/admin-experts', authenticationController.redirectLogin, authenticationController.checkAdmin, doctorController.getAllDoctors, (req, res) => {
    utils.logInRed('doctors in admin-doctors route: ', res.locals.doctors)
    res.render('views/dashboard_doctors.ejs', { doctors: res.locals.doctors, error: res.locals.error, errorType: res.locals.errorType });
});


app.get('/admin-users', authenticationController.redirectLogin, authenticationController.checkAdmin, userController.getAllUsers, (req, res) => {
    res.render('views/admin_dashboard_patients.ejs', { session: res.locals, error: res.locals.error, errorType: res.locals.errorType, users: res.locals.users });
})

app.get('/add-doctors', authenticationController.redirectLogin, authenticationController.checkAdmin, (req, res) => {
    res.render('views/dashboard_addDoctor.ejs', { session: res.locals, error: res.locals.error, errorType: res.locals.errorType, doctors: res.locals.doctors });
});



app.get('/expert-dashboard', authenticationController.redirectLogin, appointmentController.getAppointmentToDoctorDashboard, (req, res) => {
    res.render('views/doctor_dashboard.ejs', { error: res.locals.error, user: res.locals.user, errorType: 'Getting appointments', patients: res.locals.patients, appointments: res.locals.appointments, slots: res.locals.bookedSlots });
});
app.post('/rate-appointment/:id', authenticationController.redirectLogin, appointmentController.rateAppointment);

app.post('/add-doctors', doctorController.addDoctor);

app.get('/delete-doctor/:id', authenticationController.redirectLogin, authenticationController.checkAdmin, doctorController.deleteDoctor);

app.get('/admin-edit-doctor/:id', authenticationController.redirectLogin, authenticationController.checkAdmin, doctorController.getDoctor, (req, res) => {
    res.render('views/admin_edit_profile_doctor.ejs', { user: res.locals.doctor, session: res.locals, error: res.locals.error, errorType: res.locals.errorType });
})

app.post('/admin-edit-doctor', authenticationController.redirectLogin, authenticationController.checkAdmin, doctorController.adminEditDoctor);

app.get('/', authenticationController.checkOnboarding, async(req, res) => {
    var experts = await User.find({ role: 'doctor' });
    experts = await shuffleArray(experts);
    if (experts.length > 3) {
        for (var i = 1; i < experts.length; i++)
            for (var j = 0; j < i; j++)
                if ((experts[i].doctor.rating / experts[i].doctor.noOfRatings) < (experts[j].doctor.rating / experts[j].doctor.noOfRatings)) {
                    var x = experts[i];
                    experts[i] = experts[j];
                    experts[j] = x;
                }
    }
    var cateogries = [];
    var catData = await Cateogries.find({});
    console.log('catData: ', catData)
    catData.forEach((cat) => {
        cateogries.push(cat.cateogry);
    });
    if (req.headers.cookie) {
        console.log('cookie found on GET/:', req.headers.cookie);
        var token = req.headers.cookie.split('=')[1];
        console.log('splitted cookie, token is: ', token);
        var id = await utils.decryptData(token);
        console.log('decrypted id: ', id);
        User.findOne({ _id: id })
            .then(async(user) => {
                console.log('finding user...')
                if (user) {
                    console.log('found user');
                    utils.logInRed('found these experts: ', experts)
                    if (experts.length > 3) {
                        experts = await experts.slice(0, 3);
                    }
                    utils.logInGreen('sending these experts: ', experts)
                    res.render('views/index.ejs', { cateogries: cateogries, user: user, experts: experts, error: false, errorType: false })
                } else {
                    console.log('cant find user')
                    res.send('cant find user, one possible solution is to delete all cookies and signUp again')
                }
            })
    } else {
        // console.log('no cookies found on GET/, redirecting to GET /email-login')
        // res.redirect('/email-login')
        console.log('could not find user');
        var experts = await User.find({ role: 'doctor' });
        utils.logInRed('found these experts: ', experts)
        if (experts.length > 3) {
            experts = await experts.slice(0, 3);
        }
        res.render('views/index.ejs', { cateogries: cateogries, user: false, experts: experts, error: false, errorType: false })
    }
})
app.get('/getProof/:filename', authenticationController.redirectLogin, userController.getExpertiseProof)
app.post('/', authenticationController.redirectLogin2, userController.addDoctorDetails, authenticationController.redirectToRespectiveHome);

app.put('/disable-error', authenticationController.clearError);

const mid1 = async(req, res, next) => {
    req.cateogryOfExpert = req.params.cateogry;
    next()
}
app.get('/cateogries/:cateogry', mid1, doctorController.getAllDoctors, async(req, res) => {
    var aggregate = await Cateogry.aggregate([{ $group: { _id: "$cateogry" } }])
    var tags = await User.aggregate([{ $group: { _id: "$doctor.keywords" } }]);
    tags = shuffleArray(tags)
    let tagArray = [];
    tags.forEach((tag) => {
        if (typeof tag._id == "undefined" || tag._id == null || tag._id == undefined || tag._id.length < 1) {

        } else {
            tag._id.forEach((actualTag) => {
                if (!tagArray.includes(actualTag)) {
                    tagArray.push(actualTag);
                }
            })
        }
    })
    console.log('tags: ', tagArray);
    var cateogries = [];
    aggregate.forEach((cateogry) => {
        cateogries.push(cateogry._id)
    });
    doctors = [];
    if (req.cateogryOfExpert) {
        console.log('req.cateogryOfExpert: ', req.cateogryOfExpert);
        if (req.headers.cookie) {
            var token = req.headers.cookie.split('=')[1];
            var id = utils.decryptData(token);
            var user = await User.findOne({ _id: Mongoose.Types.ObjectId(id) });
            res.locals.user = user;
        }
        var unfiltered = await User.find({ role: 'doctor' });
        unfiltered.forEach((consultant) => {
            if (typeof consultant.doctor !== "undefined") {
                if (consultant.doctor.cateogry.toLowerCase().replace(/\s/g, "") == req.cateogryOfExpert.toLowerCase().replace(/\s/g, "")) {
                    doctors.push(consultant);
                }
            }
        })
        var doctorSet = new Set(doctors);
        doctors = Array.from(doctorSet);
        console.log('sending this: ', doctors)
        res.locals.doctors = doctors;
        //res.json({ doctors: res.locals.doctors })
        res.render('views/doctor.ejs', { expert: req.body.cateogry, tags: tagArray.length < 20 ? tagArray : tagArray.slice(0, 19), cateogries: cateogries, user: res.locals.user, requestBody: res.locals.requestBody, dateFromServer: res.locals.currentDate, currentDay: res.locals.currentDay, doctors: res.locals.doctors });
    }
});

app.get('/experts', doctorController.getAllDoctors, async(req, res) => {
    var aggregate = await Cateogry.aggregate([{ $group: { _id: "$cateogry" } }])
    var tags = await User.aggregate([{ $group: { _id: "$doctor.keywords" } }]);
    tags = shuffleArray(tags)
    let tagArray = [];
    tags.forEach((tag) => {
        if (typeof tag._id == "undefined" || tag._id == null || tag._id == undefined || tag._id.length < 1) {

        } else {
            tag._id.forEach((actualTag) => {
                if (!tagArray.includes(actualTag)) {
                    tagArray.push(actualTag);
                }
            })
        }
    })
    console.log('tags: ', tagArray);
    var cateogries = [];
    aggregate.forEach((cateogry) => {
        cateogries.push(cateogry._id)
    });
    console.log('the cateogries: ', cateogries);
    console.log("req.body : ", req.body);
    res.render('views/doctor.ejs', { expert: req.body.consultantType ? req.body.consultantType : "", location: req.body.location ? req.body.location : '', tags: tagArray, cateogries: cateogries, user: res.locals.user, requestBody: res.locals.requestBody, dateFromServer: res.locals.currentDate, currentDay: res.locals.currentDay, doctors: res.locals.doctors, session: res.locals, filter: res.locals.filters ? res.locals.filters : '', sort: res.locals.sortBy ? res.locals.sortBy : '', filters: res.locals.allFilters });
});

app.post('/experts', doctorController.getAllDoctors, async(req, res) => {
    var aggregate = await Cateogry.aggregate([{ $group: { _id: "$cateogry" } }]);
    var cateogries = [];
    aggregate.forEach((cateogry) => {
        cateogries.push(cateogry._id)
    });
    var tags = await User.aggregate([{ $group: { _id: "$doctor.keywords" } }]);
    tags = shuffleArray(tags)
    let tagArray = [];
    tags.forEach((tag) => {
        if (typeof tag._id == "undefined" || tag._id == null || tag._id == undefined || tag._id.length < 1) {

        } else {
            tag._id.forEach((actualTag) => {
                if (!tagArray.includes(actualTag)) {
                    tagArray.push(actualTag);
                }
            })
        }
    })
    console.log('\x1b[31m%s\x1b[0m', 'res.locals on GET /experts: ', res.locals);
    console.log('\x1b[31m%s\x1b[0m', 'res.locals.requestBody on GET /experts: ', res.locals.requestBody);
    res.render('views/doctor.ejs', { expert: req.body.consultantType ? req.body.consultantType : '', location: req.body.location ? req.body.location : '', tags: tagArray.length < 20 ? tagArray : tagArray.slice(0, 19), cateogries: cateogries, user: res.locals.user, requestBody: res.locals.requestBody, dateFromServer: res.locals.currentDate, currentDay: res.locals.currentDay, doctors: res.locals.doctors, session: res.locals, filter: res.locals.filters ? res.locals.filters : '', sort: res.locals.sortBy ? res.locals.sortBy : '', filters: res.locals.allFilters });
});
app.get('/tags/:tag', async(req, res) => {
    var aggregate = await Cateogry.aggregate([{ $group: { _id: "$cateogry" } }]);
    var cateogries = [];
    aggregate.forEach((cateogry) => {
        cateogries.push(cateogry._id)
    });
    var doctors = await User.aggregate([{ $match: { role: 'doctor' } }]);
    var selectedDoctors = [];
    doctors.forEach((doctor) => {
        if (doctor.doctor.keywords.includes(req.params.tag)) {
            selectedDoctors.push(doctor);
        }
    });
    var tags = await User.aggregate([{ $group: { _id: "$doctor.keywords" } }]);
    tags = shuffleArray(tags)
    let tagArray = [];
    tags.forEach((tag) => {
        if (typeof tag._id == "undefined" || tag._id == null || tag._id == undefined || tag._id.length < 1) {

        } else {
            tag._id.forEach((actualTag) => {
                if (!tagArray.includes(actualTag)) {
                    tagArray.push(actualTag);
                }
            })
        }
    })
    console.log(`rendering doctor.ejs with ${cateogries.length} cateogries and ${selectedDoctors.length} doctors`);
    res.render('views/doctor.ejs', { expert: req.params.tag, tags: tagArray.length < 20 ? tagArray : tagArray.slice(0, 19), cateogries: cateogries, user: res.locals.user, doctors: selectedDoctors })
})
app.post('/setServices', authenticationController.redirectLogin, async(req, res) => {
    var user = await User.findOne({ _id: res.locals.user._id });
    var reqBody = {};
    for (let i = 0; i < 10; i++) {
        if (req.body[`service${i}`].trim() !== "") {
            reqBody[req.body[`service${i}`].trim()] = req.body[`price${i}`].trim();
        }
    }
    if (Object.keys(reqBody).length > 0) {
        user.doctor.rates = [];
        Object.keys(reqBody).forEach(key => {
            let thisOne = {}
            thisOne['service'] = key;
            thisOne['charge'] = reqBody[key];
            user.doctor.rates.push(thisOne);
        })
        user.save()
            .then(user => {
                if (!user) {
                    res.json({ error: 'user not found' })
                } else {
                    res.locals.rates = user.doctor.rates;
                    res.redirect('/edit-profile-expert');
                }
            })
    } else {
        res.redirect('/edit-profile-expert');
    }
})
app.get('/about', async(req, res) => {
    if (req.headers.cookie) {
        var token = req.headers.cookie.split('=')[1];
        var id = await utils.decryptData(token);
        var user = await User.findOne({ _id: id });
        res.locals.user = user;
    }
    res.render('views/about.ejs', { session: res.locals, user: res.locals.user });
});
app.get('/contact-us', async(req, res) => {
    if (req.headers.cookie) {
        var token = req.headers.cookie.split('=')[1];
        var id = await utils.decryptData(token);
        var user = await User.findOne({ _id: id });
        res.locals.user = user;
    }
    res.render('views/contactus.ejs', { session: res.locals, user: res.locals.user });
});

app.get('/expert/:id', doctorController.getDoctor, (req, res) => {
    console.log('doctor: ', res.locals.doctor)
    res.render('views/userdetail.ejs', { session: res.locals, doctor: res.locals.doctor });
});

app.get('/appointment/:id', authenticationController.redirectLogin, appointmentController.loadingDataOnAppointmentPage);

app.post('/appointment/:id', authenticationController.redirectLogin, appointmentController.createAppointment);


// app.get('/appointment-booked/', authenticationController.redirectLogin, authenticationController.redirectAdmin, appointmentController.appointmentBooked, (req, res) => {

//     res.render('views/appointment_booked.ejs', { doctor: res.locals.doctor, patient: res.locals.patient, subslot: res.locals.subSlot, user: res.locals.user, appointmentDate: res.locals.appointmentDate, appointment: res.locals.appointment })
// });

app.get('/appointment-cancel/:id', authenticationController.redirectLogin, appointmentController.getCancelAppointment, (req, res) => {
    res.render('views/cancel_appointment.ejs', { doctor: res.locals.doctor, patient: res.locals.patient, subslot: res.locals.subslot, session: res.locals, appointmentDate: res.locals.appointmentDate, appointment: res.locals.appointment })
});

app.post('/appointment-cancel/:id', authenticationController.redirectLogin, authenticationController.redirectAdmin, appointmentController.postCancelAppointment);

app.post('/appointment-cancel/', authenticationController.redirectLogin, authenticationController.redirectAdmin, appointmentController.postCancelAppointment);

app.get('/reschedule-appointment/:id', authenticationController.redirectLogin, appointmentController.getRescheduleAppointment, (req, res) => {
    console.log('sublots69: ', res.locals.previousSubslot);
    console.log("slots: ", res.locals.slots)
    console.log('doctors69: ', res.locals.consultant);
    console.log("appointment: ", res.locals.appointment);
    console.log('currentDay: ', res.locals.currentDay);
    console.log('datefromserver: ', res.locals.currentDate)
    res.render('views/reschedule_appointment.ejs', { session: res.locals, consultant: res.locals.consultant, appointment: res.locals.appointment, currentDay: res.locals.currentDay, currentDate: res.locals.currentDate, subslot: res.locals.previousSubslot, slots: res.locals.slots });
})

app.post('/reschedule-appointment/:id', authenticationController.redirectLogin, appointmentController.postRescheduleAppointment);
app.get('/getBookingStatus/:id', authenticationController.redirectLogin, appointmentController.getBookingStatus)
app.get('/get-a-quote', authenticationController.redirectLogin, (req, res) => {
    res.render('views/get-a-quote.ejs', { session: res.locals });
})

app.get('/edit-profile', authenticationController.redirectLogin, authenticationController.redirectAdmin, (req, res) => {
    res.render('views/edit_profile.ejs', { user: res.locals.user, error: res.locals.error, errorType: res.locals.errorType });
})

app.post('/change-phone-number', userController.changePhoneNumber);

app.post('/change-phone-number-verify', userController.changePhoneNumberOTPVerify);

app.get('/user-dashboard-appointments', authenticationController.redirectLogin, appointmentController.getUserAppointments, (req, res) => {
    console.log('user: ', res.locals.user);
    console.log('doctors in express: ', res.locals.doctors);
    console.log('slots in express: ', res.locals.slots)
    console.log('appointments in express: ', res.locals.appointments)
    res.render('views/user_dashboard_appointments.ejs', { user: res.locals.user, doctors: res.locals.doctors, slots: res.locals.slots, appointments: res.locals.appointments });
});

app.get('/user-dashboard-medical-records', authenticationController.redirectLogin, authenticationController.redirectAdmin, (req, res) => {
    res.render("views/user_dashboard_medical_records.ejs", { user: res.locals.user, reports: res.locals.user.reports, errorType: res.locals.errorType, error: res.locals.error });
})

app.get('/user-dashboard-medicines', authenticationController.redirectLogin, authenticationController.redirectAdmin, (req, res) => {
    res.render('views/user_dashboard_medicines.ejs', { session: res.locals });
})


app.get('/settings', authenticationController.redirectLogin, (req, res) => {
    if (req.headers.cookie) {
        console.log('found cookie on the GET /settings ', req.headers.cookie);
        var token = req.headers.cookie.split('=')[1];
        var id = utils.decryptData(token);
        User.findOne({ _id: id })
            .then((user) => {
                {
                    if (!user) {
                        res.render('views/email-login.ejs', { errorType: 'Failure', error: 'You need to login' })
                    } else {
                        res.render('views/settings.ejs', { user: user, error: 'Fetched your settings', errorType: 'Success' });
                    }
                }
            })
    }
})

app.post('/settings', userController.settings);

app.get('/user-dashboard-lab-tests', authenticationController.redirectLogin, authenticationController.redirectAdmin, (req, res) => {
    res.render('views/user_dashboard_lab_tests.ejs', { session: res.locals });
})

app.post('/save-changes', authenticationController.redirectLogin, userController.editProfile);

app.get('/edit-profile-expert', authenticationController.redirectLogin, authenticationController.redirectAdmin, async(req, res) => {
    var token = req.headers.cookie.split('=')[1];
    var id = await utils.decryptData(token);
    User.findOne({ _id: id })
        .then((user) => {
            if (user) {
                console.log('user found on GET /edit-profile-expert: ', user);
                res.render('views/edit_profile_doctor.ejs', { user: user, error: 'Fetched Your Profile', errorType: 'Success' });
            } else {
                console.log('could not find user on GET /edit-profile-expert: ', user);
                res.render('views/email-login.ejs', { error: 'Please login first', errorType: 'Failure' });
            }
        }, e => { console.log('error at app.js 536: ', e.message) })
        .catch((e) => { e ? console.log('error at app.js 537: ', e.message) : '' });
})

app.get('/schedule-appointment', authenticationController.redirectLogin, slotController.getSlotsBasedOnDoctor, (req, res) => {
    res.render('views/schedule_appointment.ejs', { user: res.locals.user, error: res.locals.error, errorType: res.locals.errorType, slots: res.locals.slots });
})

app.post('/schedule-appointment', authenticationController.redirectLogin, slotController.addSlot);

app.post('/edit-subslots', slotController.editSubSlot);

app.post('/edit-slot', slotController.editSlot)

app.get('/delete-schedule/:id', authenticationController.redirectLogin, slotController.disableSlot);

app.post('/add-filters', doctorController.doctorFilters);

app.post('/sort-by', doctorController.doctorSort);


app.post('/filter_search', doctorController.getAllDoctors, (req, res) => {
    console.log('\x1b[31m%s\x1b[0m', 'res.locals on GET /experts: ', res.locals);
    console.log('\x1b[31m%s\x1b[0m', 'res.locals.requestBody on GET /experts: ', res.locals.requestBody);
    res.render('views/doctor.ejs', { requestBody: res.locals.requestBody, dateFromServer: res.locals.currentDate, currentDay: res.locals.currentDay, doctors: res.locals.doctors, session: res.locals, filter: res.locals.filters ? res.locals.filters : '', sort: res.locals.sortBy ? res.locals.sortBy : '', filters: res.locals.allFilters });
});

app.get('/getSearch', authenticationController.redirectLogin, authenticationController.redirectAdmin, doctorController.getSearch);

module.exports = server;