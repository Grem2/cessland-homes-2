const mongoose = require('mongoose');

const paymentNameMappingSchema = new mongoose.Schema(
  {
    paymentName: { type: String, required: true, unique: true, trim: true },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('PaymentNameMapping', paymentNameMappingSchema);
