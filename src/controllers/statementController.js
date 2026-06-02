const statementProcessor = require('../services/statementProcessor');
const asyncHandler = require('../utils/asyncHandler');

exports.upload = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  await statementProcessor.processFile(req.file.path);
  res.json({ message: 'File processed' });
});

exports.processFolder = asyncHandler(async (req, res) => {
  await statementProcessor.processPendingStatements();
  res.json({ message: 'Processing complete' });
});
