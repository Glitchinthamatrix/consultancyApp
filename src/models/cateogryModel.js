const mongoose = require('mongoose');

const cateogrySchema = new mongoose.Schema({
    cateogry: { type: String, required: true, unique: true }
})

const cateogries = mongoose.model('cateogrie', cateogrySchema);
module.exports = cateogries;