const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { readRows } = require('../utils/excelReader');

async function parseFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  let rows;

  if (ext === '.csv') {
    rows = parse(fs.readFileSync(filePath, 'utf8'), {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
  } else if (ext === '.xlsx') {
    rows = await readRows(filePath);
  } else {
    throw new Error('Unsupported statement file type. Use CSV or XLSX.');
  }

  return rows.map((row) => ({
    paymentName: row.Name || row.name || row.PaymentName || row.paymentName,
    amount: Number(row.Amount || row.amount),
    transactionRef: row.Reference || row.reference || row.Ref || row.ref,
    channel: row.Channel || row.channel || 'Unknown',
    paymentDate: new Date(row.Date || row.date)
  }));
}

module.exports = { parseFile };
