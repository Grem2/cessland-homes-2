const Building = require('../models/Building');
const Tenant = require('../models/Tenant');
const Payment = require('../models/Payment');
const asyncHandler = require('../utils/asyncHandler');
const { readRows } = require('../utils/excelReader');

exports.getAll = asyncHandler(async (req, res) => {
  const buildings = await Building.find().sort({ name: 1 });
  res.json(buildings);
});

exports.getById = asyncHandler(async (req, res) => {
  const building = await Building.findById(req.params.id);
  if (!building) return res.status(404).json({ error: 'Building not found' });

  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  const tenants = await Tenant.find({ building: building.id });
  const tenantsByUnit = new Map(tenants.map((tenant) => [String(tenant.unitId), tenant]));
  const occupiedUnits = building.units.filter((unit) => unit.isOccupied);
  const expectedRent = occupiedUnits.reduce((sum, unit) => sum + unit.rentAmount, 0);
  const payments = await Payment.find({
    building: building.id,
    paymentDate: { $gte: start, $lt: end },
    status: 'Matched'
  });
  const paymentsByUnit = payments.reduce((map, payment) => {
    const key = String(payment.unitId || '');
    map.set(key, (map.get(key) || 0) + payment.amount);
    return map;
  }, new Map());

  const unitDetails = building.units.map((unit) => {
    const tenant = tenantsByUnit.get(String(unit._id));
    const paid = paymentsByUnit.get(String(unit._id)) || 0;
    const owed = Math.max(unit.rentAmount - paid, 0);
    const status = !tenant ? 'Vacant' : paid >= unit.rentAmount ? 'Completed' : paid > 0 ? 'Partial' : 'Overdue';

    return {
      unitId: unit.id,
      unitNumber: unit.unitNumber,
      tenantName: tenant?.name || 'Vacant',
      rentAmount: unit.rentAmount,
      amountPaidThisMonth: paid,
      owed,
      status
    };
  });

  res.json({
    building,
    expectedRent,
    actualReceived: payments.reduce((sum, payment) => sum + payment.amount, 0),
    unitDetails
  });
});

exports.create = asyncHandler(async (req, res) => {
  const building = await Building.create(req.body);
  res.status(201).json(building);
});

exports.update = asyncHandler(async (req, res) => {
  const building = await Building.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!building) return res.status(404).json({ error: 'Building not found' });
  res.json(building);
});

exports.remove = asyncHandler(async (req, res) => {
  const inUse = await Tenant.exists({ building: req.params.id });
  if (inUse) return res.status(409).json({ error: 'Building has tenants and cannot be deleted' });
  await Building.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

exports.importExcel = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const rows = await readRows(req.file.path);
  const grouped = new Map();

  for (const row of rows) {
    const name = row['Building Name'] || row.buildingName || row.name;
    if (!name) continue;

    if (!grouped.has(name)) {
      grouped.set(name, {
        name,
        location: row.Location || row.location || '',
        commissionPercentage: Number(row['Commission %'] || row.commissionPercentage || 10),
        ownerName: row['Owner Name'] || row.ownerName || '',
        ownerAccountNumber: row['Owner Account'] || row.ownerAccountNumber || '',
        ownerPhone: row['Owner Phone'] || row.ownerPhone || '',
        units: []
      });
    }

    grouped.get(name).units.push({
      unitNumber: row['Unit Number'] || row.unitNumber || '',
      rentAmount: Number(row.Rent || row.rentAmount || 0)
    });
  }

  const buildings = await Building.insertMany([...grouped.values()]);
  res.json({ message: `Imported ${buildings.length} buildings with units.` });
});
