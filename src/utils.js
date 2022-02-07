// Nodejs encryption with CTR
const crypto = require('crypto');
const algorithm = 'aes-256-cbc';
const key = '4f91787e6b85f6d77378cb17ed3a8480';
const iv = 'af48c666861e93d2';

const logInRed = (data) => {
    console.log('\x1b[31m%s\x1b[0m', data);
}
const logInGreen = (data) => {
    console.log('\x1b[32m%s\x1b[0m', data);
}


function encryptData(text) {
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    console.log('encrypted')
    return encrypted.toString('hex');
}

function decryptData(encryptedData) {
    console.log('inside decryptDara, encrypted text is : ', encryptedData)
    let encryptedText = Buffer.from(encryptedData, 'hex');
    console.log('encryptedText in buffer: ', encryptedText)
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
    console.log('gonna decrypt now')
    let decrypted = decipher.update(encryptedText);
    console.log('decrypted')
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    console.log('decrypted text: ', decrypted)
    console.log('decrypted successfully')
    console.log('returning decrypted text')
    return decrypted.toString();
}

module.exports = {
    logInRed: logInRed,
    logInGreen: logInGreen,
    encryptData: encryptData,
    decryptData: decryptData
}