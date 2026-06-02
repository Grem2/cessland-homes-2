const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
    building: { type: mongoose.Schema.Types.ObjectId, ref: 'Building' },
    unitId: { type: mongoose.Schema.Types.ObjectId },
    amount: { type: Number, required: true, min: 0 },
    paymentDate: { type: Date, default: Date.now },
    channel: { type: String, required: true, trim: true },
    reference: { type: String, required: true, trim: true, index: true },
    status: { type: String, default: 'Matched', enum: ['Matched', 'Pending', 'Failed'] },
    allocated: { type: Boolean, default: false },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
