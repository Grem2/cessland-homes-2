const mongoose = require('mongoose');

const waterMeterReadingSchema = new mongoose.Schema(
  {
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    reading: { type: Number, required: true, min: 0 },
    billAmount: { type: Number, default: 0 },
    month: { type: String, required: true },
    paid: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('WaterMeterReading', waterMeterReadingSchema);
