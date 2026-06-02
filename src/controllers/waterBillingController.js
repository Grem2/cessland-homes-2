const WaterMeterReading = require('../models/WaterMeterReading');
const asyncHandler = require('../utils/asyncHandler');

exports.getAll = asyncHandler(async (req, res) => {
  const readings = await WaterMeterReading.find().populate('tenant').sort({ createdAt: -1 });
  res.json(readings);
});

exports.createReading = asyncHandler(async (req, res) => {
  const reading = await WaterMeterReading.create({
    tenant: req.body.tenantId,
    reading: Number(req.body.reading),
    month: req.body.month,
    billAmount: Number(req.body.billAmount || 0)
  });
  res.status(201).json(reading);
});
