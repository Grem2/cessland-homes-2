const Invoice = require('../models/Invoice');
const LedgerEntry = require('../models/LedgerEntry');
const Notification = require('../models/Notification');
const { currentMonth } = require('./invoiceService');

async function applyPenalties(date = new Date()) {
  const month = currentMonth(date);
  const invoices = await Invoice.find({
    month,
    $expr: { $lt: ['$amountPaid', '$totalDue'] }
  }).populate('tenant');

  for (const invoice of invoices) {
    const exists = await LedgerEntry.exists({
      invoice: invoice.id,
      description: { $regex: `Late penalty for ${month}` }
    });
    if (exists || !invoice.tenant) continue;

    const penalty = invoice.tenant.rentAmount * 0.1;
    invoice.penaltyDue += penalty;
    invoice.totalDue += penalty;
    invoice.status = 'Overdue';
    await invoice.save();

    await LedgerEntry.create({
      tenant: invoice.tenant.id,
      type: 'Debit',
      amount: penalty,
      description: `Late penalty for ${month}`,
      invoice: invoice.id
    });

    await Notification.create({
      type: 'Penalty',
      tenant: invoice.tenant.id,
      message: `Penalty KES ${penalty.toFixed(2)} added for overdue rent.`
    });
  }
}

module.exports = { applyPenalties };
