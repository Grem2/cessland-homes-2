const ExcelJS = require('exceljs');

function cellValueToString(value) {
  if (value == null) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    if (value.text) return String(value.text);
    if (value.result != null) return String(value.result);
    if (Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text || '').join('');
    }
  }
  return String(value);
}

async function readRows(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];

  const headers = [];
  worksheet.getRow(1).eachCell((cell, colNumber) => {
    headers[colNumber] = cellValueToString(cell.value).trim();
  });

  const rows = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const record = {};
    headers.forEach((header, colNumber) => {
      if (!header) return;
      record[header] = cellValueToString(row.getCell(colNumber).value).trim();
    });

    if (Object.values(record).some(Boolean)) {
      rows.push(record);
    }
  });

  return rows;
}

module.exports = { readRows };
