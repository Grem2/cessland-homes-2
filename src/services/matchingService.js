const Tenant = require('../models/Tenant');
const PaymentNameMapping = require('../models/PaymentNameMapping');

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function matchPayment(paymentName) {
  if (!paymentName) return null;

  const mapping = await PaymentNameMapping.findOne({ paymentName }).populate('tenant');
  if (mapping?.tenant) return mapping.tenant;

  return Tenant.findOne({
    paymentName: { $regex: `^${escapeRegExp(paymentName)}$`, $options: 'i' }
  });
}

module.exports = { matchPayment };
