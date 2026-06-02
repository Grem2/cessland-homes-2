const Invoice = require('../models/Invoice');
const asyncHandler = require('../utils/asyncHandler');
const { generateMonthlyInvoices } = require('../services/invoiceService');

exports.getAll = asyncHandler(async (req, res) => {
  const invoices = await Invoice.find().populate('tenant').sort({ month: -1 });
  res.json(invoices);
});

exports.getTenantInvoices = asyncHandler(async (req, res) => {
  const invoices = await Invoice.find({ tenant: req.params.tenantId }).populate('tenant').sort({ month: 1 });
  res.json({ tenant: invoices[0]?.tenant || null, invoices });
});

exports.generate = asyncHandler(async (req, res) => {
  await generateMonthlyInvoices();
  res.json({ message: 'Invoices generated' });
});
