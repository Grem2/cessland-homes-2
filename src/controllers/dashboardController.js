const Building = require('../models/Building');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const asyncHandler = require('../utils/asyncHandler');
const { currentMonth } = require('../services/invoiceService');

exports.getStats = asyncHandler(async (req, res) => {
  const buildings = await Building.find();
  const totalProperties = buildings.length;
  const totalUnits = buildings.reduce((sum, building) => sum + building.units.length, 0);
  const occupiedUnits = buildings.reduce(
    (sum, building) => sum + building.units.filter((unit) => unit.isOccupied).length,
    0
  );

  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  const payments = await Payment.find({
    paymentDate: { $gte: start, $lt: end },
    status: 'Matched'
  }).populate('tenant building').sort({ paymentDate: -1 });

  res.json({
    totalProperties,
    totalUnits,
    occupiedUnits,
    vacantUnits: totalUnits - occupiedUnits,
    occupancyRate: totalUnits ? `${((occupiedUnits / totalUnits) * 100).toFixed(1)}%` : '0%',
    totalCollectionThisMonth: payments.reduce((sum, payment) => sum + payment.amount, 0),
    recentPayments: payments.slice(0, 5).map((payment) => ({
      tenant: payment.tenant?.name || 'Unknown',
      property: `${payment.building?.name || ''} - ${payment.tenant?.unitNumber || ''}`,
      amount: payment.amount,
      date: payment.paymentDate,
      status: payment.status
    }))
  });
});

exports.getOverdue = asyncHandler(async (req, res) => {
  const invoices = await Invoice.find({
    month: currentMonth(),
    $expr: { $lt: ['$amountPaid', '$totalDue'] }
  }).populate({ path: 'tenant', populate: { path: 'building' } });

  res.json(invoices.map((invoice) => ({
    tenantName: invoice.tenant?.name,
    phone: invoice.tenant?.phone,
    unit: invoice.tenant?.unitNumber,
    building: invoice.tenant?.building?.name,
    totalOwed: invoice.totalDue - invoice.amountPaid,
    rentOwed: Math.max(invoice.rentDue + invoice.waterDue - invoice.amountPaid, 0),
    penaltyOwed: invoice.penaltyDue,
    hasPenalty: invoice.penaltyDue > 0
  })));
});
