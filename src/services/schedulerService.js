const cron = require('node-cron');
const { generateMonthlyInvoices } = require('./invoiceService');
const { applyPenalties } = require('./penaltyService');
const { processPendingStatements } = require('./statementProcessor');

function init() {
  cron.schedule('0 0 1 * *', () => generateMonthlyInvoices().catch(console.error));
  cron.schedule('0 6 10 * *', () => applyPenalties().catch(console.error));
  cron.schedule('0 * * * *', () => processPendingStatements().catch(console.error));
  console.log('Scheduler started');
}

module.exports = { init };
