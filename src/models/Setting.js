const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    value: { type: String, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Setting', settingSchema);
