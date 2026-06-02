const mongoose = require('mongoose');

const ledgerEntrySchema = new mongoose.Schema(
  {
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    type: { type: String, required: true, enum: ['Debit', 'Credit'] },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, required: true, trim: true },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('LedgerEntry', ledgerEntrySchema);
