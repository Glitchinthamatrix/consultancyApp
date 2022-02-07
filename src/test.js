var crypto = require('crypto');
var token = crypto.randomBytes(32);
console.log('token: ' + token.toString('hex'))