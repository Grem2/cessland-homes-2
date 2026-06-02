const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    month: { type: String, required: true },
    rentDue: { type: Number, required: true, min: 0 },
    waterDue: { type: Number, default: 0 },
    penaltyDue: { type: Number, default: 0 },
    totalDue: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, default: 0 },
    status: { type: String, default: 'Unpaid', enum: ['Unpaid', 'Partial', 'Paid', 'Overdue'] },
    generatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

invoiceSchema.index({ tenant: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
