const Payment = require('../models/Payment');
const Tenant = require('../models/Tenant');
const asyncHandler = require('../utils/asyncHandler');
const { applyPaymentToInvoice } = require('../services/invoiceService');

exports.getAll = asyncHandler(async (req, res) => {
  const payments = await Payment.find().populate('tenant building invoice').sort({ paymentDate: -1 });
  res.json(payments);
});

exports.createManual = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.body.tenantId);
  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

  const payment = await Payment.create({
    tenant: tenant.id,
    building: tenant.building,
    unitId: tenant.unitId,
    amount: Number(req.body.amount),
    channel: req.body.channel || 'Manual',
    reference: req.body.reference || `MANUAL-${Date.now()}`,
    paymentDate: req.body.paymentDate ? new Date(req.body.paymentDate) : new Date(),
    status: 'Matched',
    allocated: true
  });

  await applyPaymentToInvoice(payment);
  res.status(201).json(payment);
});
