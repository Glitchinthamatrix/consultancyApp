const User = require("./../models/userModel");
const bcrypt = require("bcryptjs");
const Nexmo = require("nexmo");
require("dotenv").config({ path: __dirname + "/../config.env" });
const utils = require("../utils");
const { response } = require("express");
const nodemailer = require("nodemailer");
// Nexmo used for OTP.
const Mongoose = require("mongoose");
const dotenv = require('dotenv');
dotenv.config({ path: '../config.env' });
const path = require('path');
const { GridFsStorage } = require('multer-gridfs-storage');
const multer = require('multer');


let userGFS;
var createConnection = async() => {
    const mongoURI = "mongodb+srv://Nitesh:mayday9501@ecommerceweb.efse8.mongodb.net/PROJECT0?retryWrites=true&w=majority";
    var connect = await Mongoose.createConnection(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    if (!connect) {
        console.log('createConnection err: ', err.message)
    } else {
        console.log('DB connection for gridFS bucket established')
        userGFS = new Mongoose.mongo.GridFSBucket(connect.db, { bucketName: 'users' }, (err) => {
            if (err) {
                console.log('gridFSBucket not connected')
            } else {
                console.log('gridFSBucket connected')
            }
        })
    }
}
createConnection();
const todaysDate = new Date();
const mongoURI = "mongodb+srv://Nitesh:mayday9501@ecommerceweb.efse8.mongodb.net/PROJECT0?retryWrites=true&w=majority";
const userFileStorage = new GridFsStorage({
    url: mongoURI,
    file: async(req, file) => {
        console.log('queries in userFileStorage: ', { queries: req.query, body: req.body })
        var filename;
        if (req.url.includes('user-profile') && req.method == "POST") {
            filename = req.query.curr_display_picture;
        } else if (req.url.includes('save-changes') && req.method == "POST") {
            filename = req.query.curr_display_picture;
        } else {
            filename = req.body.phoneNumber + path.extname(file.originalname);
        }
        return new Promise((resolve, reject) => {
            var fileInfo = {
                filename: filename,
                bucketName: 'users'
            };
            resolve(fileInfo);
        })
    }
});


const uploadUser = multer({
    storage: userFileStorage,
    fileFilter: (req, file, cb) => {
        utils.logInRed('here, here you little shit')
        console.log('req.body in uploadUser: ', req.body);
        console.log("name: ", req.body.name)
        return cb(null, true)
    }
}).single('profilePicture');

const getUserProfilePicture = async(req, res, next) => {
    userGFS.openDownloadStreamByName(req.params.filename).pipe(res);
}

function sendMail(reciever, message) {

    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: "ny040021@gmail.com",
            pass: 'Cottoncandy699501',
            clientId: '483434678846-00a39kijffp7mi6ajgmqpvrkhedmmug4.apps.googleusercontent.com',
            clientSecret: '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',
            refreshToken: '1//04Ltor59So6JcCgYIARAAGAQSNwF-L9Irpeqv0DXUoHsfezs1Tyh5N44796GlDqBc5DgwLSdKdi27D9Hbt9HVYZgrMXA0HzwD_ho'
        }
    });
    var mailOptions = {
        from: "ny040021@gmail.com",
        to: reciever.toString(),
        subject: "Sending Email from consultancy app",
        text: "Got an email",
        html: `<h1>${message}</h1>`,
    };

    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('\x1b[32m%s\x1b[0m', `email sent ${info.response}`);
            console.log('\x1b[32m%s\x1b[0m', `email sent to ${reciever}`);
        }
    });
}


// Check if user is logged in if he is not then redirect to login page.
const redirectLogin = async(req, res, next) => {
    if (!req.headers.cookie) {
        res.locals.error = "You need to login";
        res.locals.errorType = "Failure";
        res.redirect('/email-login')
    } else {
        var token = req.headers.cookie.split('=')[1];
        var id = await utils.decryptData(token);
        User.findOne({ _id: id })
            .then((user) => {
                if (user) {
                    res.locals.user = user;
                    next();
                } else {
                    res.render('views/email-login.ejs', { errorType: 'Failure', error: 'Could not find user with with this token, make sure you have signed up' })
                }
            })
    }
};
const redirectIfCookie = (req, res, next) => {
    console.log("inside redirectIfCookie function");
    if (req.headers.cookie) {
        console.log("cookie found: ", req.headers.cookie);
        var token = req.headers.cookie.split("=")[1];
        var id = utils.decryptData(token);
        console.log("decrypted id: " + id + " from token " + token);
        User.findOne({ _id: id }).then((user) => {
            if (user) {
                console.log("found user: ", user);
                if (user.role === "admin") {
                    res.redirect("/admin");
                    console.log("rdeirected admin to admin panel");
                } else {
                    res.redirect("/");
                    console.log("redirected user to user panel");
                }
            } else {
                console.log("user not found: ", user);
                next();
            }
        });
    } else {
        console.log("cookie not found: ", req.headers.cookie);
        next();
    }
};
const redirectLogin2 = (req, res, next) => {
    if (!req.headers.cookie) {
        res.redirect("/email-login");
    } else {
        next();
    }
};

const clearError = (req, res, next) => {
    res.locals.error = "";
    next();
};

// Check if user is logged in if he is then redirect to home page.
const redirectHome = (req, res, next) => {
    if (res.locals.userId) {
        if (res.locals.user.role === "user") res.redirect("/home");
    } else {
        next();
    }
};

const redirectToRespectiveHome = (req, res, next) => {
    if (req.headers.cookie) {
        console.log("found cookie on GET /email-login: ", req.headers.cookie);
        var token = req.headers.cookie.split("=")[1];
        var id = utils.decryptData(token);
        User.findOne({ _id: id }).then((user) => {
            if (user) {
                user.role === "admin" ? res.redirect("/admin") : res.redirect("/");
            } else {
                console.log(
                    "no cookie found on GET /email-login, rendering email-login.ejs"
                );
                res.render("views/email-login.ejs", { error: res.locals.error, errorType: res.locals.errorType });
            }
        });
    } else {
        res.render("views/email-login.ejs", { error: res.locals.error, errorType: res.locals.errorType });
    }
};

const signUp = async(req, res, next) => {
    const todaysDate = new Date();
    console.log('isDoctor: ', req.body.isDoctor);
    console.log('req body outside uploadUser: ', req.body ? req.body : 'no req file');
    uploadUser(req, res, async(err) => {
        var extname = path.extname(req.file.originalname);
        console.log('extname is ', extname)
        req.file.originalname = req.body.isDoctor == "on" ? 'doctor' : 'user' + "_" + req.body.phoneNumber + "_" + todaysDate.getHours() + extname;
        console.log('set the req.body variable: ', req.body)
            // res.json({ user: req.body, file: 'uploaded' });
        if (err) {
            console.log('error at uplaodUser: ', err);
            res.json({ errorAtUploadUser: err })
        } else {
            //utils.logInGreen('image uploaded successfully');
            console.log({ user: req.body, file: 'uploaded' })

            console.log("req.body: ", req.body);
            console.log("reqBody: ", req.body);
            console.log('req.file? ', req.file ? req.file : 'No')
            var phoneExists = await User.findOne({ phoneNumber: req.body.phoneNumber });
            var emailExists = await User.findOne({ email: req.body.email });
            // res.json({ user: req.body.isDoctor, file: req.file.originalname });
            if (emailExists) {
                res.render('views/signup.ejs', { user: req.body, errorType: 'Failure', error: 'Email already exists, login if you have an account' })
            } else if (phoneExists) {
                res.render('views/signup.ejs', { user: req.body, errorType: 'Failure', error: 'phone number already registered, login if you have an account' })
            } else {
                const newUser = await User.create({
                    name: req.body.name,
                    display_picture: req.body.phoneNumber + extname,
                    gender: req.body.gender,
                    dob: req.body.dob,
                    phoneNumber: req.body.phoneNumber,
                    email: req.body.email,
                    password: req.body.password,
                    location: req.body.location,
                    state: req.body.state,
                    country: req.body.country,
                    role: req.body.isDoctor == "on" ? 'doctor' : 'user'
                });
                console.log("created new user: ", newUser);
                console.log("mongoose ID: ", newUser._id);
                console.log("mongoose ID in string : ", newUser._id.toString());
                var cookie = utils.encryptData(newUser._id.toString());
                console.log("encrypted cookie: ", cookie);

                if (newUser.role === "doctor") {
                    console.log("setting cookie insilde signup function for doctor");
                    sendMail(newUser.email, 'Bonjour, this is a mail from the consultancy app');
                    var now = new Date();
                    var time = now.getTime();
                    time += 3600 * 1000;
                    now.setTime(time);
                    res.cookie("doctor", cookie, { secure: true, httpOnly: true, expires: now });
                    console.log('cookie set for doctor')
                    res.render("views/doctor_onboarding.ejs", { user: newUser });
                } else {
                    console.log("setting cookie insilde signup function for user");
                    sendMail(newUser.email, 'Bonjour, this is a mail from the consultancy app');
                    var now = new Date();
                    var time = now.getTime();
                    time += 3600 * 1000;
                    now.setTime(time);
                    res.cookie("user", cookie, { secure: true, httpOnly: true, expires: now });
                    console.log('cookie set for user')
                    res.render('views/index.ejs', { user: newUser, error: res.locals.error, errorType: res.locals.errorType })
                }
            }
        }
    })
};
const editUserProfile = async(req, res, next) => {
    console.log('request for profi;e edition: ', req.body)
    uploadUser(req, res, async(err) => {
        if (err) {
            res.json({ error: err });
        } else {
            var token = req.headers.cookie.split('=')[1];
            var id = await utils.decryptData(token);

            const user = await User.findOne({ _id: Mongoose.Types.ObjectId(id) });

            user.display_picture = req.query.curr_display_picture;
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
            user.save()
                .then((user) => {
                    if (user) {
                        res.render('views/user-profile.ejs', { user: user });
                    } else {
                        res.json({ error: 'Your profile could not be edited' })
                    }
                }, e => { res.json({ error: e }) })
                .catch((e) => { res.json({ error: e }) })
        }
    })
}
const emailLogin = async(req, res, next) => {
    if (req.body.email && req.body.password) {
        const user = await User.findOne({ email: req.body.email });
        if (user) {
            const passwordCorrect = await bcrypt.compare(req.body.password, user.password);
            if (passwordCorrect) {
                res.locals.errorType = "Success";
                res.locals.error = "Login Successful";
                res.locals.userId = user.id;
                res.locals.user = user;
                sendMail(user.email, 'You logged in your account');
                if (user.role === "admin") res.redirect("/admin");
                else res.redirect("/");
            } else {
                res.render('views/email-login.ejs', { errorType: 'Failure', error: 'Email not found, make sure you have signed up' })
            }
        } else {
            res.render('views/email-login.ejs', { errorType: 'Failure', error: 'Email is not registered' })
        }
    }
};

const phoneLogin = async(req, res, next) => {
    if (req.body.phoneNumber) {
        const user = await User.findOne({ phoneNumber: req.body.phoneNumber });
        // const passwordCorrect = await user.comparePassword(req.body.password, user.password);
        const nexmoRequestOTPCallback = (err, result) => {
            if (err) console.log(err);
            else {
                res.locals.request_id = result.request_id;
                console.log("Requesting OTP");
                console.log(res.locals.request_id);
                res.locals.user = user;
                res.locals.error = "Valid Only for 60 Secs";
                res.locals.errorType = "Info";
                res.redirect("/otp");
            }
        };
        if (user) {
            nexmo.verify.request({
                    number: "91" + req.body.phoneNumber,
                    brand: "solvent",
                    code_length: "4",
                    workflow_id: "6",
                    pin_expiry: "120",
                },
                nexmoRequestOTPCallback
            );
            // console.log('91' + req.body.phoneNumber);
        } else {
            res.locals.errorType = "Failure";
            res.locals.error = "Number not associated with any user.";
            res.redirect("/phone-login");
        }
    } else res.redirect("/phone-login");
};

// This function requests OTP for the user number from nexmo.
const checkOTP = async(req, res, next) => {
    const nexmoVerifyCallback = (err, result) => {
        if (err) {
            res.locals.errorType = "Failure";
            res.locals.error = "Please try again after some time.";
            res.redirect("/otp");
        } else {
            if (
                result.error_text ==
                "The code provided does not match the expected value"
            ) {
                res.locals.errorType = "Failure";
                res.locals.error = "Incorrect OTP";
                res.redirect("/otp");
            } else {
                if (res.locals.forgetPassword) {
                    console.log(res.locals);
                    res.redirect("/create-new-password");
                } else {
                    res.locals.errorType = "Success";
                    res.locals.error = "Login Successful";
                    res.locals.userId = res.locals.user._id;
                    res.locals.request_id = null;
                    res.locals.save();
                    // console.log(res.locals);
                    next();
                }
            }
        }
    };
    req.body.otp = `${
    req.body.otp_1 + req.body.otp_2 + req.body.otp_3 + req.body.otp_4
  }`;
    if (req.body.otp.length === 4) {
        nexmo.verify.check({
                request_id: res.locals.request_id,
                code: req.body.otp,
            },
            nexmoVerifyCallback
        );
    } else {
        res.redirect("/otp");
    }
};

const checkCancel = (req, res, next) => {
    if (res.locals.request_id) res.redirect("/otp");
    else next();
};

const cancelOldOTP = async(req, res, next) => {
    const cancelRequestCallback = (err, result) => {
        if (err) console.log(err);
        else {
            const nexmoRequestOTPCallback = (err, result) => {
                if (err) console.log(err);
                else {
                    res.locals.request_id = result.request_id;
                    console.log("Requesting OTP");
                    res.locals.error = "Valid Only for 60 Secs";
                    res.locals.errorType = "Info";
                    res.redirect("/otp");
                }
            };

            nexmo.verify.request({
                    number: "91" + res.locals.user.phoneNumber,
                    brand: "solvent",
                    code_length: "4",
                    workflow_id: "6",
                    pin_expiry: "60",
                },
                nexmoRequestOTPCallback
            );
        }
    };

    nexmo.verify.control({
            request_id: res.locals.request_id,
            cmd: "cancel",
        },
        cancelRequestCallback
    );
};

const checkAdmin = async(req, res, next) => {
    if (res.locals.user) {
        if (res.locals.user.role !== "admin") {
            res.locals.errorType = "Failure";
            res.locals.error = "It doesn't look like you're an admin";
            res.redirect('/email-login')
        } else {
            next();
        }
    } else {
        if (req.headers.cookie) {
            var token = req.headers.cookie.split('=')[1];
            var id = await utils.decryptData(token);
            User.findOne({ _id: Mongoose.Types.ObjectId(id) })
                .then((user) => {
                    if (user) {
                        if (user.role === "admin") {
                            next();
                        } else {
                            res.locals.errorType = "Failure";
                            res.locals.error = "It doesn't look like you're an admin";
                            res.redirect('/email-login')
                        }
                    } else {
                        res.locals.errorType = "Failure";
                        res.locals.error = "It doesn't look like you're registered";
                        res.redirect('/email-login')
                    }
                }, e => { utils.logInRed("error: ", e.message) })
                .catch((e) => { utils.logInRed('error: ', e.message) })

        } else {
            res.locals.errorType = "Failure";
            res.locals.error = "It doesn't look like you've logged in";
            res.redirect('/email-login')
        }
    }
};



const redirectAdmin = (req, res, next) => {
    if (req.headers.cookie) {
        console.log(
            "found cookie in redirectAdmin, checking if admin: ",
            req.headers.cookie
        );
        var token = req.headers.cookie.split("=")[1];
        console.log("token after splitting: ", token);
        var id = utils.decryptData(token);
        console.log("objectID after decrypting: ", id);
        User.findOne({ _id: id })
            .then((user) => {
                console.log("found user on POST/: ", user);
                if (user.role === 'admin') {
                    res.locals.user = user;
                    res.redirect('/admin');
                } else {
                    res.locals.user = user;
                    next();
                }
            });
    }
    next();
};

const logout = (req, res, next) => {
    console.log("insilde logout function");
    var token = req.headers.cookie.split("=")[1];
    var id = utils.decryptData(token);
    User.findOne({ _id: id }).then((user) => {
        console.log("found user");
        if (user) {
            user.role === "doctor" ?
                res.clearCookie("doctor") :
                res.clearCookie("user");
            console.log("cleared cookie");
        } else {
            res.send("could not logout");
        }
    });
    res.redirect("/email-login");
};

const checkIfUserExists = async(req, res, next) => {
    console.log("Checking if user exists");
    console.log(req.body.email);
    if (req.body.email) {
        const user = await User.findOne({ email: req.body.email });
        if (user) {
            req.body.phoneNumber = user.phoneNumber;
            res.locals.forgetPassword = true;
            next();
        } else {
            res.locals.error = "Email Not registered";
            res.locals.errorType = "Failure";
            res.redirect("/email-login");
        }
    } else {
        (res.locals.error = "Please provide your email"),
        (res.locals.errorType = "Failure"),
        res.redirect("/email-login");
    }
};

const changePassword = async(req, res, next) => {
    if (req.headers.cookie) {
        var token = req.headers.cookie.split('=')[1];
        var id = utils.decryptData(token);
        var user = await User.findOne({ _id: Mongoose.Types.ObjectId(id) });
        var validPassword = await bcrypt.compare(req.body.curr_password, user.password);
        if (validPassword) {
            if (req.body.newPassword === req.body.newPasswordConfirm) {
                user.password = await bcrypt.hash(req.body.newPassword, 12);
                await user.save();
                res.locals.forgetPassword = false;
                res.locals.error = "Password Changed Successfully";
                res.locals.errorType = "Success";
                res.locals.request_id = null;
                delete res.locals.user;
                delete res.locals.userId;
                res.redirect("/email-login");
            } else {
                res.locals.error = "Passwords do not match";
                res.locals.errorType = "Failure";
                res.redirect("/create-new-password");
            }
        } else {
            res.locals.error = "Wrong current password";
            res.locals.errorType = "Failure";
            res.redirect("/create-new-password");
        }
    } else {
        res.locals.error = "You need to login again";
        res.locals.errorType = "Failure";
        res.redirect("/email-login");
    }
};

const onBoardingDone = (req, res, next) => {
    console.log(res.locals.user);
    if (res.locals.user.role === "doctor") {
        console.log(res.locals.user.doctor);
        if (res.locals.user.doctor) {
            next();
        } else {
            res.render('views/doctor_onboarding.ejs', { user: user, errorType: 'Info', error: 'Provide additional information' })
        }
    } else {
        next();
    }
};

const checkOnboarding = (req, res, next) => {
    console.log(res.locals.user);
    if (req.headers.cookie) {
        var token = req.headers.cookie.split('=')[1];
        var id = utils.decryptData(token);
        User.findOne({ _id: id })
            .then((user) => {
                if (user) {
                    if (user.role === 'doctor') {
                        if (user.doctor) {
                            next()
                        } else {
                            res.render('views/doctor_onboarding.ejs', { user: user, errorType: 'Failure', error: 'Provide required information' });
                        }
                    } else {
                        next()
                    }
                } else {
                    res.render('views/email-login.ejs', { errorType: 'Failure', error: 'You need to login' })
                }
            })
    } else {
        console.log('in checkOnboarding, not a doctor, sending ahead')
            //res.render('/views/earna/index.ejs', { user: false })
            //res.render(__dirname.split('controllers')[0] + 'views\\earna\\index.ejs');
        next()
    }
}
const redirectNormalUser = async(req, res, next) => {
    var token = req.headers.cookie.split('=')[1];
    var id = await utils.decryptData(token);
    var user = await User.findOne({ _id: Mongoose.Types.ObjectId(id) });
    if (user.role === 'doctor' || user.role === 'admin') {
        next()
    } else {
        res.send('You are not authorized to access this route')
    }
}
module.exports = {
    redirectLogin: redirectLogin,
    redirectLogin2: redirectLogin2,
    signUp: signUp,
    redirectHome: redirectHome,
    phoneLogin: phoneLogin,
    emailLogin: emailLogin,
    checkOTP: checkOTP,
    checkCancel: checkCancel,
    logout: logout,
    clearError: clearError,
    redirectIfCookie: redirectIfCookie,
    checkAdmin: checkAdmin,
    redirectAdmin: redirectAdmin,
    redirectToRespectiveHome: redirectToRespectiveHome,
    cancelOldOTP: cancelOldOTP,
    checkIfUserExists: checkIfUserExists,
    changePassword: changePassword,
    checkOnboarding: checkOnboarding,
    onBoardingDone: onBoardingDone,
    redirectNormalUser: redirectNormalUser,
    sendMail: sendMail,
    getUserProfilePicture: getUserProfilePicture,
    editUserProfile: editUserProfile,
    uploadUser: uploadUser
};