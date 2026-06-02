const Setting = require('../models/Setting');
const asyncHandler = require('../utils/asyncHandler');

exports.getAll = asyncHandler(async (req, res) => {
  res.json(await Setting.find().sort({ key: 1 }));
});

exports.upsert = asyncHandler(async (req, res) => {
  const setting = await Setting.findOneAndUpdate(
    { key: req.body.key },
    { value: req.body.value },
    { upsert: true, new: true, runValidators: true }
  );
  res.json(setting);
});
