const mongoose = require('mongoose');

const colorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  code: { type: String, required: true, trim: true },
}, { timestamps: true });

module.exports = mongoose.model('Color', colorSchema);
