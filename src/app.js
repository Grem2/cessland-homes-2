const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const buildingRoutes = require('./routes/buildingRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const statementRoutes = require('./routes/statementRoutes');
const unmatchedPaymentRoutes = require('./routes/unmatchedPaymentRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const waterBillingRoutes = require('./routes/waterBillingRoutes');
const reportRoutes = require('./routes/reportRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const penaltyRoutes = require('./routes/penaltyRoutes');
const settingRoutes = require('./routes/settingRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'cessland-homes' });
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/buildings', buildingRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/statements', statementRoutes);
app.use('/api/unmatched-payments', unmatchedPaymentRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/water-billing', waterBillingRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/penalties', penaltyRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/audit-logs', auditLogRoutes);

app.use(errorHandler);

module.exports = app;
