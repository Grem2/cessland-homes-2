const Building = require('../models/Building');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const asyncHandler = require('../utils/asyncHandler');

exports.collections = asyncHandler(async (req, res) => {
  const buildings = await Building.find();
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  const result = [];
  for (const building of buildings) {
    const expected = building.units
      .filter((unit) => unit.isOccupied)
      .reduce((sum, unit) => sum + unit.rentAmount, 0);

    const payments = await Payment.find({
      building: building.id,
      paymentDate: { $gte: start, $lt: end },
      status: 'Matched'
    });
    const actual = payments.reduce((sum, payment) => sum + payment.amount, 0);

    result.push({
      building: building.name,
      expected,
      actual,
      commission: actual * (building.commissionPercentage / 100)
    });
  }

  res.json(result);
});

exports.aging = asyncHandler(async (req, res) => {
  const invoices = await Invoice.find({ $expr: { $lt: ['$amountPaid', '$totalDue'] } });
  const now = new Date();
  const aging = { '0-30': 0, '31-60': 0, '60+': 0 };

  for (const invoice of invoices) {
    const invoiceDate = new Date(`${invoice.month}-01`);
    const diffDays = (now - invoiceDate) / (1000 * 60 * 60 * 24);
    const overdue = invoice.totalDue - invoice.amountPaid;

    if (diffDays <= 30) aging['0-30'] += overdue;
    else if (diffDays <= 60) aging['31-60'] += overdue;
    else aging['60+'] += overdue;
  }

  res.json(aging);
});
