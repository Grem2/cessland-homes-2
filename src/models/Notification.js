const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, trim: true },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
    message: { type: String, required: true, trim: true },
    sentAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
