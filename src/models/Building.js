const mongoose = require('mongoose');

const unitSchema = new mongoose.Schema(
  {
    unitNumber: { type: String, required: true, trim: true },
    rentAmount: { type: Number, required: true, min: 0 },
    isOccupied: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const buildingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    location: { type: String, trim: true, default: '' },
    commissionPercentage: { type: Number, default: 10 },
    ownerName: { type: String, trim: true },
    ownerAccountNumber: { type: String, trim: true },
    ownerPhone: { type: String, trim: true },
    units: [unitSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Building', buildingSchema);
