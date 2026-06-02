const Payment = require('../models/Payment');
const PaymentNameMapping = require('../models/PaymentNameMapping');
const Tenant = require('../models/Tenant');
const UnmatchedPayment = require('../models/UnmatchedPayment');
const asyncHandler = require('../utils/asyncHandler');
const { applyPaymentToInvoice } = require('../services/invoiceService');

exports.getAll = asyncHandler(async (req, res) => {
  const unmatched = await UnmatchedPayment.find({ status: 'Unmatched' }).sort({ paymentDate: -1 });
  res.json(unmatched);
});

exports.allocate = asyncHandler(async (req, res) => {
  const unmatched = await UnmatchedPayment.findById(req.params.id);
  const tenant = await Tenant.findById(req.body.tenantId);

  if (!unmatched) return res.status(404).json({ error: 'Unmatched payment not found' });
  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

  const payment = await Payment.create({
    tenant: tenant.id,
    building: tenant.building,
    unitId: tenant.unitId,
    amount: unmatched.amount,
    channel: unmatched.channel || 'Unknown',
    reference: unmatched.transactionRef,
    paymentDate: unmatched.paymentDate,
    status: 'Matched',
    allocated: true
  });

  await PaymentNameMapping.findOneAndUpdate(
    { paymentName: unmatched.paymentName },
    { tenant: tenant.id },
    { upsert: true, new: true }
  );

  unmatched.status = 'Matched';
  await unmatched.save();
  await applyPaymentToInvoice(payment);

  res.json({ message: 'Allocated successfully', paymentId: payment.id });
});
