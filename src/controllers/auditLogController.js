const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../utils/asyncHandler');

exports.getAll = asyncHandler(async (req, res) => {
  const logs = await AuditLog.find().populate('user').sort({ createdAt: -1 }).limit(100);
  res.json(logs);
});
