const mongoose = require('mongoose');

const sittingDepositPaymentSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now }
  },
  { _id: false }
);

const tenantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    paymentName: { type: String, trim: true, index: true },
    idNumber: { type: String, trim: true },
    building: { type: mongoose.Schema.Types.ObjectId, ref: 'Building', required: true },
    unitId: { type: mongoose.Schema.Types.ObjectId, required: true },
    unitNumber: { type: String, required: true, trim: true },
    rentAmount: { type: Number, required: true, min: 0 },
    leaseStart: { type: Date, required: true },
    leaseEnd: { type: Date },
    sdAmount: { type: Number, default: 0 },
    sdPaid: { type: Number, default: 0 },
    sdPayments: [sittingDepositPaymentSchema],
    waterMeterId: { type: String, trim: true }
  },
  { timestamps: true }
);

tenantSchema.index({ building: 1, unitId: 1 }, { unique: true });

module.exports = mongoose.model('Tenant', tenantSchema);
