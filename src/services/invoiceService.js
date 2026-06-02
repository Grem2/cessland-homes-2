const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Tenant = require('../models/Tenant');
const WaterMeterReading = require('../models/WaterMeterReading');

function currentMonth(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

async function applyPaymentToInvoice(payment) {
  if (!payment.tenant) return null;

  const month = currentMonth(payment.paymentDate);
  const invoice = await Invoice.findOne({ tenant: payment.tenant, month });
  if (!invoice) return null;

  invoice.amountPaid += payment.amount;
  invoice.status = invoice.amountPaid >= invoice.totalDue ? 'Paid' : 'Partial';
  await invoice.save();

  payment.invoice = invoice.id;
  await payment.save();
  return invoice;
}

async function generateMonthlyInvoices(date = new Date()) {
  const month = currentMonth(date);
  const tenants = await Tenant.find({ leaseEnd: { $exists: false } });

  for (const tenant of tenants) {
    const exists = await Invoice.exists({ tenant: tenant.id, month });
    if (exists) continue;

    const waterReading = await WaterMeterReading.findOne({ tenant: tenant.id, month }).sort({ createdAt: -1 });
    const waterDue = waterReading?.billAmount || 0;

    await Invoice.create({
      tenant: tenant.id,
      month,
      rentDue: tenant.rentAmount,
      waterDue,
      penaltyDue: 0,
      totalDue: tenant.rentAmount + waterDue,
      amountPaid: 0,
      status: 'Unpaid'
    });
  }
}

module.exports = {
  applyPaymentToInvoice,
  currentMonth,
  generateMonthlyInvoices
};
