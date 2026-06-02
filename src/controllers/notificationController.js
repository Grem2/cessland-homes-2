const Invoice = require('../models/Invoice');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const { currentMonth } = require('../services/invoiceService');

exports.getAll = asyncHandler(async (req, res) => {
  const notifications = await Notification.find().populate('tenant').sort({ createdAt: -1 }).limit(100);
  res.json(notifications);
});

exports.overdueTenants = asyncHandler(async (req, res) => {
  const invoices = await Invoice.find({
    month: currentMonth(),
    $expr: { $lt: ['$amountPaid', '$totalDue'] }
  }).populate('tenant');

  res.json(invoices.map((invoice) => ({
    tenantName: invoice.tenant?.name,
    phone: invoice.tenant?.phone,
    unit: invoice.tenant?.unitNumber,
    totalOwed: invoice.totalDue - invoice.amountPaid,
    rentOwed: Math.max(invoice.rentDue + invoice.waterDue - invoice.amountPaid, 0),
    penaltyOwed: invoice.penaltyDue,
    hasPenalty: invoice.penaltyDue > 0
  })));
});
