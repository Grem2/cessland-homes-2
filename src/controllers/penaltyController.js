const asyncHandler = require('../utils/asyncHandler');
const { applyPenalties } = require('../services/penaltyService');

exports.run = asyncHandler(async (req, res) => {
  await applyPenalties();
  res.json({ message: 'Penalties applied if applicable' });
});
