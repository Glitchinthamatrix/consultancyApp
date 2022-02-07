# solvent App

## solvent App is an web app where patients can book appointments with doctors.

## [Click Here For Demo](https://solvent-app.herokuapp.com)

## [LinkedIn Profile](https://www.linkedin.com/in/harpalsinhjadeja)


## Use cases

* Patients can book, reschedule and cancel appointment.
* Patients can search for doctors.
* Patients can upload medical records.
* Patients can edit their profile.
* Patients can login via Email or Phone Number (Login with phone number might not work because the OTP service credit might have been utilized).
* Doctors can weekly schedule appointments.
* Doctors can disable specific subslot.
* Doctors can disable specific days.
* Doctors can schedule appointments for multiple hospitals.
* Admin can add new doctors.
* Admin can verify hospitals.

## Technologies Used

* HTML, SCSS, JAVASCRIPT.
* Mongoose on top of MongoDB.
* Express on top of NodeJS.
* Nexmo API for OTP Service.


## Types of Users

* Patient
* Doctor
* Admin


## Demo Credentials (email::password)

* Patient - user@gmail.com::Harpal1509.
* Doctor - doctor@gmail.com::Harpal1509.
* Admin - harpal@gmail.com::Harpal1509.


## Before you can use this project locally you will need.

1. MongoDB Atlas Account.
2. Nexmo (Vonage) Account.


## How can i locally host this project ?

1. Fork this repository.
2. Clone or Download to your local computer.
3. Create a `config.env` in `src` folder.
4. Set enviornment variables as mentioned below.
5. Open terminal in project root folder.
6. Execute command `npm install` in order to install all dependencies.
7. Execute command `nodemon server.js` to start the server locally.

## Environment Variables.

1. `DATABASE` - MongoDB Database URL (URL starts with 'mongodb+srv://')
2. `DB_PASSWORD` - Database Password.
3. `DB_USERNAME` - Database username.
4. `PORT` - Port on which you want the server to listen for requests. (Default is 8000)
5. `NEXMO_API_KEY` - Nexmo Application key can be found in Application settings or while creating application.
6. `NEXMO_API_SECRET` - Nexmo Application key can be found in Application settings or while creating application.






