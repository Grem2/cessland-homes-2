const fs = require('fs');
const path = require('path');
const Payment = require('../models/Payment');
const UnmatchedPayment = require('../models/UnmatchedPayment');
const { applyPaymentToInvoice } = require('./invoiceService');
const { matchPayment } = require('./matchingService');
const { parseFile } = require('./statementParser');

const STATEMENTS_DIR = path.join(__dirname, '..', '..', 'statements');

async function processFile(filePath) {
  const transactions = await parseFile(filePath);

  for (const tx of transactions) {
    const tenant = await matchPayment(tx.paymentName);

    if (tenant) {
      const payment = await Payment.create({
        tenant: tenant.id,
        building: tenant.building,
        unitId: tenant.unitId,
        amount: tx.amount,
        paymentDate: tx.paymentDate,
        channel: tx.channel,
        reference: tx.transactionRef,
        status: 'Matched',
        allocated: false
      });
      await applyPaymentToInvoice(payment);
    } else {
      await UnmatchedPayment.create({
        paymentName: tx.paymentName,
        amount: tx.amount,
        transactionRef: tx.transactionRef,
        channel: tx.channel,
        paymentDate: tx.paymentDate,
        rawData: tx
      });
    }
  }
}

async function processPendingStatements() {
  if (!fs.existsSync(STATEMENTS_DIR)) return;

  const files = fs.readdirSync(STATEMENTS_DIR).filter((file) => {
    return ['.csv', '.xlsx'].includes(path.extname(file).toLowerCase());
  });

  for (const file of files) {
    const filePath = path.join(STATEMENTS_DIR, file);
    await processFile(filePath);
    fs.renameSync(filePath, `${filePath}.processed`);
  }
}

module.exports = { processFile, processPendingStatements };
