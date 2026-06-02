const Building = require('../models/Building');
const Tenant = require('../models/Tenant');
const asyncHandler = require('../utils/asyncHandler');
const { readRows } = require('../utils/excelReader');

async function occupyUnit(buildingId, unitId, occupied) {
  await Building.updateOne(
    { _id: buildingId, 'units._id': unitId },
    { $set: { 'units.$.isOccupied': occupied } }
  );
}

async function getUnit(buildingId, unitId) {
  const building = await Building.findById(buildingId);
  const unit = building?.units.id(unitId);
  return { building, unit };
}

exports.getAll = asyncHandler(async (req, res) => {
  const tenants = await Tenant.find().populate('building').sort({ name: 1 });
  res.json(tenants);
});

exports.getById = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.params.id).populate('building');
  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
  res.json(tenant);
});

exports.create = asyncHandler(async (req, res) => {
  const { buildingId, unitId } = req.body;
  const { building, unit } = await getUnit(buildingId, unitId);
  if (!building || !unit) return res.status(404).json({ error: 'Unit not found' });
  if (unit.isOccupied) return res.status(409).json({ error: 'Unit is already occupied' });

  const tenant = await Tenant.create({
    ...req.body,
    building: building.id,
    unitId: unit._id,
    unitNumber: unit.unitNumber,
    rentAmount: unit.rentAmount,
    leaseStart: new Date(req.body.leaseStart)
  });

  await occupyUnit(building.id, unit._id, true);
  res.status(201).json(tenant);
});

exports.update = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
  res.json(tenant);
});

exports.remove = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.params.id);
  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
  await occupyUnit(tenant.building, tenant.unitId, false);
  await tenant.deleteOne();
  res.json({ message: 'Deleted' });
});

exports.addSdPayment = asyncHandler(async (req, res) => {
  const amount = Number(req.body.amount || 0);
  const tenant = await Tenant.findById(req.params.id);
  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
  if (tenant.sdPaid + amount > tenant.sdAmount) return res.status(400).json({ error: 'SD overpayment' });

  tenant.sdPaid += amount;
  tenant.sdPayments.push({ amount });
  await tenant.save();

  res.json({ message: 'SD payment recorded', sdRemaining: tenant.sdAmount - tenant.sdPaid });
});

exports.importExcel = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const rows = await readRows(req.file.path);
  let count = 0;

  for (const row of rows) {
    const buildingName = row['Building Name'] || row.buildingName;
    const unitNumber = row['Unit Number'] || row.unitNumber;
    const building = await Building.findOne({ name: buildingName });
    const unit = building?.units.find((item) => item.unitNumber === String(unitNumber));
    if (!building || !unit || unit.isOccupied) continue;

    await Tenant.create({
      name: row.Name || row.name,
      phone: row.Phone || row.phone || '',
      email: row.Email || row.email,
      paymentName: row['Payment Name'] || row.paymentName,
      idNumber: row['ID Number'] || row.idNumber,
      building: building.id,
      unitId: unit._id,
      unitNumber: unit.unitNumber,
      rentAmount: unit.rentAmount,
      leaseStart: new Date(row['Lease Start (YYYY-MM-DD)'] || row.leaseStart),
      sdAmount: Number(row['SD Amount'] || row.sdAmount || 0),
      waterMeterId: row['Water Meter ID'] || row.waterMeterId || ''
    });

    await occupyUnit(building.id, unit._id, true);
    count++;
  }

  res.json({ message: `Imported ${count} tenants.` });
});
