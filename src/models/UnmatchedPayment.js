const mongoose = require('mongoose');

const unmatchedPaymentSchema = new mongoose.Schema(
  {
    paymentName: { type: String, required: true, trim: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    transactionRef: { type: String, required: true, trim: true },
    channel: { type: String, trim: true },
    paymentDate: { type: Date, required: true },
    status: { type: String, default: 'Unmatched', enum: ['Unmatched', 'Matched'] },
    rawData: { type: mongoose.Schema.Types.Mixed }
  },
  { timestamps: true }
);

module.exports = mongoose.model('UnmatchedPayment', unmatchedPaymentSchema);
