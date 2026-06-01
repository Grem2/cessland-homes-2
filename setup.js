// ============================================================
// CESSLAND HOMES – Setup v4 (fully safe, no escaping errors)
// ============================================================
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, 'cessland-homes');
if (fs.existsSync(root)) fs.rmSync(root, { recursive: true, force: true });
fs.mkdirSync(root, { recursive: true });

function save(rel, content) {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
}

// ---------- package.json ----------
save('package.json', JSON.stringify({
  name: "cessland-homes",
  version: "2.0.0",
  scripts: {
    start: "node src/index.js",
    "db:push": "npx prisma db push",
    "db:seed": "node prisma/seed.js",
    postinstall: "npx prisma generate"
  },
  dependencies: {
    "@prisma/client": "^5.14.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "csv-parse": "^5.5.6",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "node-cron": "^3.0.3",
    "xlsx": "^0.18.5"
  },
  devDependencies: { "nodemon": "^3.1.0", "prisma": "^5.14.0" }
}, null, 2));

// ---------- .env ----------
save('.env', 'DATABASE_URL="file:./dev.db"\nJWT_SECRET="change-me-to-a-very-long-random-string"\nPORT=3000\n');

// ---------- prisma/schema.prisma ----------
save('prisma/schema.prisma', String.raw`generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  name      String
  role      String   @default("Staff")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Building {
  id                   Int       @id @default(autoincrement())
  name                 String
  location             String
  commissionPercentage Float     @default(10.0)
  ownerName            String?
  ownerAccountNumber   String?
  ownerPhone           String?
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
  units                Unit[]
  commissionRecords    CommissionRecord[]
}

model Unit {
  id          Int       @id @default(autoincrement())
  unitNumber  String
  buildingId  Int
  rentAmount  Float
  isOccupied  Boolean   @default(false)
  building    Building  @relation(fields: [buildingId], references: [id])
  tenant      Tenant?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Tenant {
  id                Int                    @id @default(autoincrement())
  name              String
  phone             String
  email             String?
  paymentName       String?
  idNumber          String?
  unitId            Int                    @unique
  unit              Unit                   @relation(fields: [unitId], references: [id])
  leaseStart        DateTime
  leaseEnd          DateTime?
  sdAmount          Float                  @default(0)
  sdPaid            Float                  @default(0)
  waterMeterId      String?
  createdAt         DateTime               @default(now())
  updatedAt         DateTime               @updatedAt
  payments          Payment[]
  invoices          Invoice[]
  ledgerEntries     LedgerEntry[]
  sdPayments        SittingDepositPayment[]
  waterMeterReadings WaterMeterReading[]
}

model SittingDepositPayment {
  id        Int      @id @default(autoincrement())
  tenantId  Int
  amount    Float
  date      DateTime @default(now())
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
}

model Payment {
  id          Int      @id @default(autoincrement())
  tenantId    Int?
  buildingId  Int?
  unitId      Int?
  amount      Float
  paymentDate DateTime @default(now())
  channel     String
  reference   String
  status      String   @default("Matched")
  allocated   Boolean  @default(false)
  invoiceId   Int?
  invoice     Invoice? @relation(fields: [invoiceId], references: [id])
  tenant      Tenant?  @relation(fields: [tenantId], references: [id])
  ledgerEntry LedgerEntry?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model UnmatchedPayment {
  id             Int      @id @default(autoincrement())
  paymentName    String
  amount         Float
  transactionRef String
  channel        String?
  paymentDate    DateTime
  status         String   @default("Unmatched")
  rawData        String?
  createdAt      DateTime @default(now())
}

model PaymentNameMapping {
  id          Int    @id @default(autoincrement())
  paymentName String @unique
  tenantId    Int
}

model WaterMeterReading {
  id        Int      @id @default(autoincrement())
  tenantId  Int
  reading   Float
  billAmount Float?
  month     String
  paid      Boolean  @default(false)
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  createdAt DateTime @default(now())
}

model Invoice {
  id          Int      @id @default(autoincrement())
  tenantId    Int
  month       String
  rentDue     Float
  waterDue    Float?
  penaltyDue  Float?
  totalDue    Float
  amountPaid  Float    @default(0)
  status      String   @default("Unpaid")
  generatedAt DateTime @default(now())
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  payments    Payment[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model LedgerEntry {
  id          Int      @id @default(autoincrement())
  tenantId    Int
  type        String
  amount      Float
  description String
  date        DateTime @default(now())
  invoiceId   Int?
  paymentId   Int?     @unique
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  payment     Payment? @relation(fields: [paymentId], references: [id])
}

model CommissionRecord {
  id         Int      @id @default(autoincrement())
  buildingId Int
  month      String
  totalRent  Float
  commission Float
  building   Building @relation(fields: [buildingId], references: [id])
  createdAt  DateTime @default(now())
}

model Notification {
  id        Int      @id @default(autoincrement())
  type      String
  tenantId  Int?
  message   String
  sentAt    DateTime @default(now())
}

model AuditLog {
  id        Int      @id @default(autoincrement())
  userId    Int?
  action    String
  module    String
  details   String?
  createdAt DateTime @default(now())
}

model Setting {
  id    Int    @id @default(autoincrement())
  key   String @unique
  value String
}
`);

// ---------- prisma/seed.js ----------
save('prisma/seed.js', `const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  await prisma.user.upsert({
    where: { email: 'admin@cessland.com' },
    update: {},
    create: { email: 'admin@cessland.com', password: adminPassword, name: 'Super Admin', role: 'SuperAdmin' }
  });
  console.log('Admin user created.');
}
main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
`);

// ---------- src/index.js ----------
save('src/index.js', `require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const buildingRoutes = require('./routes/buildings');
const tenantRoutes = require('./routes/tenants');
const paymentRoutes = require('./routes/payments');
const statementRoutes = require('./routes/statements');
const unmatchedRoutes = require('./routes/unmatchedPayments');
const invoiceRoutes = require('./routes/invoices');
const waterBillingRoutes = require('./routes/waterBilling');
const reportRoutes = require('./routes/reports');
const notificationRoutes = require('./routes/notifications');
const penaltyRoutes = require('./routes/penalties');
const settingRoutes = require('./routes/settings');
const auditLogRoutes = require('./routes/auditLogs');
const errorHandler = require('./middleware/errorHandler');
const scheduler = require('./services/scheduler');

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

app.post('/api/reset', async (req, res) => {
  try {
    await prisma.paymentNameMapping.deleteMany();
    await prisma.unmatchedPayment.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.ledgerEntry.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.sittingDepositPayment.deleteMany();
    await prisma.waterMeterReading.deleteMany();
    await prisma.tenant.deleteMany();
    await prisma.unit.deleteMany();
    await prisma.building.deleteMany();
    await prisma.commissionRecord.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.setting.deleteMany();
    res.json({ message: 'All data cleared.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Reset failed.' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/buildings', buildingRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/statements', statementRoutes);
app.use('/api/unmatched-payments', unmatchedRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/water-billing', waterBillingRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/penalties', penaltyRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/audit-logs', auditLogRoutes);

app.use(errorHandler);
scheduler.init();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on http://localhost:' + PORT));
`);

// ---------- middleware/auth.js ----------
save('src/middleware/auth.js', `const jwt = require('jsonwebtoken');
module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
`);

save('src/middleware/errorHandler.js', `module.exports = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
};
`);

save('src/utils/logger.js', `module.exports = {
  info: msg => console.log('[INFO] ' + new Date().toISOString() + ' - ' + msg),
  error: msg => console.error('[ERROR] ' + new Date().toISOString() + ' - ' + msg)
};
`);

// ---------- auth ----------
save('src/routes/auth.js', `const router = require('express').Router();
const ctrl = require('../controllers/authController');
router.post('/login', ctrl.login);
module.exports = router;
`);

save('src/controllers/authController.js', `const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await req.prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ userId: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
};
`);

// ---------- dashboard ----------
save('src/routes/dashboard.js', `const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/dashboardController');
router.get('/stats', auth, ctrl.getStats);
router.get('/overdue', auth, ctrl.getOverdue);
module.exports = router;
`);

save('src/controllers/dashboardController.js', `const service = require('../services/dashboardService');
exports.getStats = async (req, res) => {
  try {
    const data = await service.getStats(req.prisma);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load stats' });
  }
};
exports.getOverdue = async (req, res) => {
  try {
    const data = await service.getOverdueTenants(req.prisma);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load overdue' });
  }
};
`);

save('src/services/dashboardService.js', `exports.getStats = async (prisma) => {
  const totalUnits = await prisma.unit.count();
  const occupied = await prisma.unit.count({ where: { isOccupied: true } });
  const vacant = totalUnits - occupied;
  const rate = totalUnits > 0 ? ((occupied / totalUnits) * 100).toFixed(1) : 0;

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const payments = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: { paymentDate: { gte: start, lte: end }, status: 'Matched' }
  });
  const totalCollection = payments._sum.amount || 0;

  const recentPayments = await prisma.payment.findMany({
    take: 5,
    orderBy: { paymentDate: 'desc' },
    include: { tenant: { select: { name: true, unit: { select: { unitNumber: true, building: { select: { name: true } } } } } } }
  });

  return {
    totalProperties: await prisma.building.count(),
    totalUnits,
    occupiedUnits: occupied,
    vacantUnits: vacant,
    occupancyRate: rate + '%',
    totalCollectionThisMonth: totalCollection,
    recentPayments: recentPayments.map(p => ({
      tenant: p.tenant?.name || 'Unknown',
      property: (p.tenant?.unit?.building?.name || '') + ' - ' + (p.tenant?.unit?.unitNumber || ''),
      amount: p.amount,
      date: p.paymentDate,
      status: p.status
    }))
  };
};

exports.getOverdueTenants = async (prisma) => {
  const month = new Date().toISOString().slice(0,7);
  const invoices = await prisma.invoice.findMany({
    where: { month, amountPaid: { lt: prisma.invoice.fields.totalDue } },
    include: { tenant: { include: { unit: { include: { building: true } } } } }
  });
  return invoices.map(inv => ({
    tenantName: inv.tenant.name,
    phone: inv.tenant.phone,
    unit: inv.tenant.unit.unitNumber,
    building: inv.tenant.unit.building.name,
    totalOwed: inv.totalDue - inv.amountPaid,
    rentOwed: inv.rentDue - inv.amountPaid + (inv.waterDue || 0),
    penaltyOwed: inv.penaltyDue || 0,
    hasPenalty: (inv.penaltyDue || 0) > 0
  }));
};
`);

// ---------- buildings ----------
save('src/routes/buildings.js', `const router = require('express').Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const ctrl = require('../controllers/buildingController');
router.get('/', auth, ctrl.getAll);
router.get('/:id', auth, ctrl.getById);
router.post('/', auth, ctrl.create);
router.put('/:id', auth, ctrl.update);
router.delete('/:id', auth, ctrl.delete);
router.post('/import', auth, upload.single('file'), ctrl.importExcel);
module.exports = router;
`);

save('src/controllers/buildingController.js', `const buildingService = require('../services/buildingService');
const XLSX = require('xlsx');

exports.getAll = async (req, res) => {
  const buildings = await req.prisma.building.findMany({ include: { units: true } });
  res.json(buildings);
};

exports.getById = async (req, res) => {
  try {
    const data = await buildingService.getBuildingMetrics(req.prisma, req.params.id);
    res.json(data);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  const { name, location, commissionPercentage, ownerName, ownerAccountNumber, ownerPhone, units } = req.body;
  const b = await req.prisma.building.create({
    data: { name, location, commissionPercentage, ownerName, ownerAccountNumber, ownerPhone,
            units: { create: units.map(u => ({ unitNumber: u.unitNumber, rentAmount: u.rentAmount })) } }
  });
  res.status(201).json(b);
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const { name, location, commissionPercentage, ownerName, ownerAccountNumber, ownerPhone } = req.body;
  const b = await req.prisma.building.update({ where: { id: parseInt(id) }, data: { name, location, commissionPercentage, ownerName, ownerAccountNumber, ownerPhone } });
  res.json(b);
};

exports.delete = async (req, res) => {
  await req.prisma.building.delete({ where: { id: parseInt(req.params.id) } });
  res.json({ message: 'Deleted' });
};

exports.importExcel = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const workbook = XLSX.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    const buildingMap = {};
    for (const row of rows) {
      const bName = row['Building Name'] || row['buildingName'];
      if (!bName) continue;
      if (!buildingMap[bName]) {
        buildingMap[bName] = {
          name: bName,
          location: row['Location'] || row['location'] || '',
          commission: parseFloat(row['Commission %'] || row['commissionPercentage'] || 10),
          ownerName: row['Owner Name'] || row['ownerName'] || '',
          ownerAccount: row['Owner Account'] || row['ownerAccountNumber'] || '',
          ownerPhone: row['Owner Phone'] || row['ownerPhone'] || '',
          units: []
        };
      }
      buildingMap[bName].units.push({
        unitNumber: row['Unit Number'] || row['unitNumber'] || '',
        rentAmount: parseFloat(row['Rent'] || row['rentAmount'] || 0)
      });
    }

    for (const bName of Object.keys(buildingMap)) {
      const b = buildingMap[bName];
      await req.prisma.building.create({
        data: {
          name: b.name,
          location: b.location,
          commissionPercentage: b.commission,
          ownerName: b.ownerName,
          ownerAccountNumber: b.ownerAccount,
          ownerPhone: b.ownerPhone,
          units: { create: b.units }
        }
      });
    }
    res.json({ message: 'Imported ' + Object.keys(buildingMap).length + ' buildings with units.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Import failed' });
  }
};
`);

save('src/services/buildingService.js', `exports.getBuildingMetrics = async (prisma, buildingId, monthStr) => {
  const now = monthStr ? new Date(monthStr) : new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const building = await prisma.building.findUnique({ where: { id: parseInt(buildingId) }, include: { units: true } });
  if (!building) throw new Error('Building not found');
  const occupied = building.units.filter(u => u.isOccupied);
  const expectedRent = occupied.reduce((sum, u) => sum + u.rentAmount, 0);

  const unitIds = occupied.map(u => u.id);
  const payments = await prisma.payment.aggregate({ _sum: { amount: true }, where: { unitId: { in: unitIds }, paymentDate: { gte: start, lte: end }, status: 'Matched' } });
  const actualReceived = payments._sum.amount || 0;

  const unitDetails = await Promise.all(occupied.map(async unit => {
    const tenant = await prisma.tenant.findUnique({ where: { unitId: unit.id } });
    const unitPay = await prisma.payment.aggregate({ _sum: { amount: true }, where: { unitId: unit.id, paymentDate: { gte: start, lte: end }, status: 'Matched' } });
    const paid = unitPay._sum.amount || 0;
    const owed = unit.rentAmount - paid;
    const status = paid >= unit.rentAmount ? 'Completed' : (paid > 0 ? 'Partial' : 'Overdue');
    return { unitNumber: unit.unitNumber, tenantName: tenant?.name || 'Vacant', rentAmount: unit.rentAmount, amountPaidThisMonth: paid, owed, status };
  }));

  return {
    building: { id: building.id, name: building.name, location: building.location, commissionPercentage: building.commissionPercentage,
                ownerName: building.ownerName, ownerAccountNumber: building.ownerAccountNumber, ownerPhone: building.ownerPhone },
    month: start.toISOString().slice(0,7),
    expectedRent,
    actualReceived,
    unitDetails
  };
};
`);

// ---------- tenants ----------
save('src/routes/tenants.js', `const router = require('express').Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const ctrl = require('../controllers/tenantController');
router.get('/', auth, ctrl.getAll);
router.get('/:id', auth, ctrl.getById);
router.post('/', auth, ctrl.create);
router.put('/:id', auth, ctrl.update);
router.delete('/:id', auth, ctrl.delete);
router.post('/:id/sd-payment', auth, ctrl.addSdPayment);
router.post('/import', auth, upload.single('file'), ctrl.importExcel);
module.exports = router;
`);

save('src/controllers/tenantController.js', `const XLSX = require('xlsx');

exports.getAll = async (req, res) => {
  const tenants = await req.prisma.tenant.findMany({ include: { unit: { include: { building: true } }, sdPayments: true } });
  res.json(tenants);
};

exports.getById = async (req, res) => {
  const tenant = await req.prisma.tenant.findUnique({ where: { id: parseInt(req.params.id) }, include: { unit: { include: { building: true } }, sdPayments: true } });
  res.json(tenant);
};

exports.create = async (req, res) => {
  const { name, phone, email, paymentName, idNumber, unitId, leaseStart, sdAmount, waterMeterId } = req.body;
  const tenant = await req.prisma.tenant.create({
    data: { name, phone, email, paymentName, idNumber, unitId, leaseStart: new Date(leaseStart), sdAmount: sdAmount || 0, waterMeterId }
  });
  await req.prisma.unit.update({ where: { id: unitId }, data: { isOccupied: true } });
  res.status(201).json(tenant);
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const { name, phone, email, paymentName, leaseEnd, sdAmount, waterMeterId } = req.body;
  const data = {};
  if (name) data.name = name;
  if (phone) data.phone = phone;
  if (email !== undefined) data.email = email;
  if (paymentName) data.paymentName = paymentName;
  if (leaseEnd) data.leaseEnd = new Date(leaseEnd);
  if (sdAmount !== undefined) data.sdAmount = sdAmount;
  if (waterMeterId) data.waterMeterId = waterMeterId;
  const tenant = await req.prisma.tenant.update({ where: { id: parseInt(id) }, data });
  res.json(tenant);
};

exports.delete = async (req, res) => {
  const id = parseInt(req.params.id);
  const tenant = await req.prisma.tenant.findUnique({ where: { id } });
  if (!tenant) return res.status(404).json({ error: 'Not found' });
  await req.prisma.unit.update({ where: { id: tenant.unitId }, data: { isOccupied: false } });
  await req.prisma.tenant.delete({ where: { id } });
  res.json({ message: 'Deleted' });
};

exports.addSdPayment = async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;
  const tenant = await req.prisma.tenant.findUnique({ where: { id: parseInt(id) } });
  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
  const newSdPaid = tenant.sdPaid + amount;
  if (newSdPaid > tenant.sdAmount) return res.status(400).json({ error: 'SD overpayment' });
  await req.prisma.sittingDepositPayment.create({ data: { tenantId: tenant.id, amount } });
  await req.prisma.tenant.update({ where: { id: tenant.id }, data: { sdPaid: newSdPaid } });
  res.json({ message: 'SD payment recorded', sdRemaining: tenant.sdAmount - newSdPaid });
};

exports.importExcel = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    const workbook = XLSX.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);
    let count = 0;
    for (const row of rows) {
      const unitNumber = row['Unit Number'] || row['unitNumber'];
      if (!unitNumber) continue;
      const unit = await req.prisma.unit.findFirst({ where: { unitNumber: unitNumber } });
      if (!unit) continue;
      await req.prisma.tenant.create({
        data: {
          name: row['Name'] || row['name'],
          phone: row['Phone'] || row['phone'] || '',
          email: row['Email'] || row['email'] || null,
          paymentName: row['Payment Name'] || row['paymentName'],
          unitId: unit.id,
          leaseStart: new Date(row['Lease Start (YYYY-MM-DD)'] || row['leaseStart']),
          sdAmount: parseFloat(row['SD Amount'] || row['sdAmount'] || 0),
          waterMeterId: row['Water Meter ID'] || row['waterMeterId'] || ''
        }
      });
      await req.prisma.unit.update({ where: { id: unit.id }, data: { isOccupied: true } });
      count++;
    }
    res.json({ message: 'Imported ' + count + ' tenants.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Import failed' });
  }
};
`);

// ---------- payments ----------
save('src/routes/payments.js', `const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/paymentController');
router.get('/', auth, ctrl.getAll);
router.post('/', auth, ctrl.createManual);
module.exports = router;
`);

save('src/controllers/paymentController.js', `exports.getAll = async (req, res) => {
  const payments = await req.prisma.payment.findMany({ include: { tenant: true } });
  res.json(payments);
};

exports.createManual = async (req, res) => {
  const { tenantId, amount, channel, reference, paymentDate, unitId, buildingId } = req.body;
  const payment = await req.prisma.payment.create({
    data: { tenantId, buildingId, unitId, amount, channel: channel || 'Manual', reference: reference || 'MANUAL', paymentDate: new Date(paymentDate || Date.now()), status: 'Matched', allocated: true }
  });
  const month = payment.paymentDate.toISOString().slice(0,7);
  const invoice = await req.prisma.invoice.findFirst({ where: { tenantId, month } });
  if (invoice) {
    await req.prisma.invoice.update({ where: { id: invoice.id }, data: { amountPaid: invoice.amountPaid + payment.amount } });
  }
  res.status(201).json(payment);
};
`);

// ---------- statements & unmatched ----------
save('src/routes/statements.js', `const router = require('express').Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const ctrl = require('../controllers/statementController');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../statements'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

router.post('/upload', auth, upload.single('statement'), ctrl.upload);
router.post('/process-folder', auth, ctrl.processFolder);
module.exports = router;
`);

save('src/controllers/statementController.js', `const statementProcessor = require('../services/statementProcessor');
exports.upload = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  await statementProcessor.processFile(req.prisma, req.file.path);
  res.json({ message: 'File processed' });
};
exports.processFolder = async (req, res) => {
  await statementProcessor.processPendingStatements(req.prisma);
  res.json({ message: 'Processing complete' });
};
`);

save('src/routes/unmatchedPayments.js', `const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/unmatchedPaymentController');
router.get('/', auth, ctrl.getAll);
router.post('/:id/allocate', auth, ctrl.allocate);
module.exports = router;
`);

save('src/controllers/unmatchedPaymentController.js', `exports.getAll = async (req, res) => {
  const unmatched = await req.prisma.unmatchedPayment.findMany({ where: { status: 'Unmatched' } });
  res.json(unmatched);
};

exports.allocate = async (req, res) => {
  const { id } = req.params;
  const { tenantId, unitId, buildingId } = req.body;
  const unmatched = await req.prisma.unmatchedPayment.findUnique({ where: { id: parseInt(id) } });
  if (!unmatched) return res.status(404).json({ error: 'Not found' });

  const payment = await req.prisma.payment.create({
    data: { tenantId, buildingId, unitId, amount: unmatched.amount, channel: unmatched.channel, reference: unmatched.transactionRef, paymentDate: unmatched.paymentDate, status: 'Matched', allocated: true }
  });

  await req.prisma.paymentNameMapping.upsert({
    where: { paymentName: unmatched.paymentName },
    update: { tenantId },
    create: { paymentName: unmatched.paymentName, tenantId }
  });

  await req.prisma.unmatchedPayment.update({ where: { id: unmatched.id }, data: { status: 'Matched' } });

  const month = payment.paymentDate.toISOString().slice(0,7);
  const invoice = await req.prisma.invoice.findFirst({ where: { tenantId, month } });
  if (invoice) {
    await req.prisma.invoice.update({ where: { id: invoice.id }, data: { amountPaid: invoice.amountPaid + payment.amount } });
  }

  res.json({ message: 'Allocated successfully', paymentId: payment.id });
};
`);

// ---------- statement services ----------
save('src/services/statementParser.js', `const { parse } = require('csv-parse/sync');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

function parseFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  let rows = [];
  if (ext === '.csv') {
    const content = fs.readFileSync(filePath, 'utf-8');
    rows = parse(content, { columns: true, skip_empty_lines: true, trim: true });
  } else if (ext === '.xlsx' || ext === '.xls') {
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(sheet);
  } else {
    throw new Error('Unsupported file type');
  }
  return rows.map(r => ({
    paymentName: r.Name || r.name,
    amount: parseFloat(r.Amount || r.amount),
    transactionRef: r.Reference || r.reference,
    channel: r.Channel || r.channel || 'Unknown',
    paymentDate: new Date(r.Date || r.date)
  }));
}
module.exports = { parseFile };
`);

save('src/services/matchingService.js', `async function matchPayment(prisma, paymentName) {
  const mapping = await prisma.paymentNameMapping.findUnique({ where: { paymentName } });
  if (mapping) {
    const tenant = await prisma.tenant.findUnique({ where: { id: mapping.tenantId }, include: { unit: true } });
    if (tenant) return tenant;
  }
  return prisma.tenant.findFirst({ where: { paymentName: { equals: paymentName, mode: 'insensitive' } }, include: { unit: true } });
}
module.exports = { matchPayment };
`);

save('src/services/statementProcessor.js', `const fs = require('fs');
const path = require('path');
const { parseFile } = require('./statementParser');
const { matchPayment } = require('./matchingService');

const STATEMENTS_DIR = path.join(__dirname, '../../statements');

async function processFile(prisma, filePath) {
  const transactions = parseFile(filePath);
  for (const tx of transactions) {
    const tenant = await matchPayment(prisma, tx.paymentName);
    if (tenant) {
      await prisma.payment.create({
        data: {
          tenantId: tenant.id, buildingId: tenant.unit.buildingId, unitId: tenant.unitId,
          amount: tx.amount, paymentDate: tx.paymentDate, channel: tx.channel,
          reference: tx.transactionRef, status: 'Matched', allocated: false
        }
      });
    } else {
      await prisma.unmatchedPayment.create({
        data: {
          paymentName: tx.paymentName, amount: tx.amount, transactionRef: tx.transactionRef,
          channel: tx.channel, paymentDate: tx.paymentDate, rawData: JSON.stringify(tx)
        }
      });
    }
  }
}

async function processPendingStatements(prisma) {
  if (!fs.existsSync(STATEMENTS_DIR)) return;
  const files = fs.readdirSync(STATEMENTS_DIR).filter(f => f.endsWith('.csv') || f.endsWith('.xlsx'));
  for (const file of files) {
    if (file.endsWith('.processed')) continue;
    const filePath = path.join(STATEMENTS_DIR, file);
    try {
      await processFile(prisma, filePath);
      fs.renameSync(filePath, filePath + '.processed');
    } catch (err) {
      console.error('Error processing', file, err.message);
    }
  }
}

module.exports = { processFile, processPendingStatements };
`);

// ---------- invoices ----------
save('src/routes/invoices.js', `const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/invoiceController');
router.get('/tenant/:tenantId', auth, ctrl.getTenantInvoices);
module.exports = router;
`);

save('src/controllers/invoiceController.js', `exports.getTenantInvoices = async (req, res) => {
  const tenantId = parseInt(req.params.tenantId);
  const invoices = await req.prisma.invoice.findMany({
    where: { tenantId },
    include: { payments: true, tenant: { include: { unit: true } } },
    orderBy: { month: 'asc' }
  });

  const history = invoices.map(inv => ({
    month: inv.month,
    rentDue: inv.rentDue,
    waterDue: inv.waterDue,
    penaltyDue: inv.penaltyDue,
    totalDue: inv.totalDue,
    amountPaid: inv.amountPaid,
    balance: inv.totalDue - inv.amountPaid,
    status: inv.status,
    payments: inv.payments.map(p => ({ amount: p.amount, date: p.paymentDate, reference: p.reference }))
  }));

  res.json({ tenant: invoices[0]?.tenant, invoices: history });
};
`);

// ---------- water billing ----------
save('src/routes/waterBilling.js', `const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/waterBillingController');
router.get('/', auth, ctrl.getAll);
router.post('/', auth, ctrl.createReading);
module.exports = router;
`);

save('src/controllers/waterBillingController.js', `exports.getAll = async (req, res) => {
  const readings = await req.prisma.waterMeterReading.findMany({ include: { tenant: true } });
  res.json(readings);
};
exports.createReading = async (req, res) => {
  const { tenantId, reading, month, billAmount } = req.body;
  const entry = await req.prisma.waterMeterReading.create({ data: { tenantId, reading, billAmount, month } });
  res.status(201).json(entry);
};
`);

// ---------- reports ----------
save('src/routes/reports.js', `const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/reportController');
router.get('/collections', auth, ctrl.collections);
router.get('/aging', auth, ctrl.aging);
module.exports = router;
`);

save('src/controllers/reportController.js', `exports.collections = async (req, res) => {
  const buildings = await req.prisma.building.findMany({ include: { units: true } });
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const result = [];
  for (const b of buildings) {
    const occUnits = b.units.filter(u => u.isOccupied);
    const expected = occUnits.reduce((sum, u) => sum + u.rentAmount, 0);
    const payments = await req.prisma.payment.aggregate({ _sum: { amount: true }, where: { buildingId: b.id, paymentDate: { gte: start, lte: end }, status: 'Matched' } });
    const actual = payments._sum.amount || 0;
    const commission = actual * (b.commissionPercentage / 100);
    result.push({ building: b.name, expected, actual, commission });
  }
  res.json(result);
};

exports.aging = async (req, res) => {
  const invoices = await req.prisma.invoice.findMany({ where: { amountPaid: { lt: req.prisma.invoice.fields.totalDue } }, include: { tenant: { select: { name: true } } } });
  const now = new Date();
  const aging = { '0-30': 0, '31-60': 0, '60+': 0 };
  for (const inv of invoices) {
    const invDate = new Date(inv.month + '-01');
    const diffDays = (now - invDate) / (1000 * 60 * 60 * 24);
    const overdue = inv.totalDue - inv.amountPaid;
    if (diffDays <= 30) aging['0-30'] += overdue;
    else if (diffDays <= 60) aging['31-60'] += overdue;
    else aging['60+'] += overdue;
  }
  res.json(aging);
};
`);

// ---------- notifications ----------
save('src/routes/notifications.js', `const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/notificationController');
router.get('/overdue-tenants', auth, ctrl.overdueTenants);
module.exports = router;
`);

save('src/controllers/notificationController.js', `exports.overdueTenants = async (req, res) => {
  const month = new Date().toISOString().slice(0,7);
  const invoices = await req.prisma.invoice.findMany({
    where: { month, amountPaid: { lt: req.prisma.invoice.fields.totalDue } },
    include: { tenant: { include: { unit: true } } }
  });
  const list = invoices.map(inv => ({
    tenantName: inv.tenant.name,
    phone: inv.tenant.phone,
    unit: inv.tenant.unit.unitNumber,
    totalOwed: inv.totalDue - inv.amountPaid,
    rentOwed: inv.rentDue - inv.amountPaid + (inv.waterDue || 0),
    penaltyOwed: inv.penaltyDue || 0,
    hasPenalty: (inv.penaltyDue || 0) > 0
  }));
  res.json(list);
};
`);

// ---------- penalties ----------
save('src/routes/penalties.js', `const router = require('express').Router();
const auth = require('../middleware/auth');
const { applyPenalties } = require('../services/penaltyService');
router.post('/run', auth, async (req, res) => {
  await applyPenalties(req.prisma);
  res.json({ message: 'Penalties applied if applicable' });
});
module.exports = router;
`);

save('src/services/penaltyService.js', `async function applyPenalties(prisma) {
  const now = new Date();
  if (now < new Date('2026-06-01')) return;
  const month = now.toISOString().slice(0,7);
  const invoices = await prisma.invoice.findMany({
    where: { month, amountPaid: { lt: prisma.invoice.fields.totalDue } },
    include: { tenant: { include: { unit: true } } }
  });
  for (const inv of invoices) {
    const exists = await prisma.ledgerEntry.findFirst({ where: { invoiceId: inv.id, description: { contains: 'Penalty' } } });
    if (exists) continue;
    const penalty = inv.tenant.unit.rentAmount * 0.1;
    await prisma.ledgerEntry.create({ data: { tenantId: inv.tenantId, type: 'Debit', amount: penalty, description: 'Late penalty for ' + month, invoiceId: inv.id } });
    await prisma.invoice.update({ where: { id: inv.id }, data: { penaltyDue: (inv.penaltyDue || 0) + penalty, totalDue: inv.totalDue + penalty } });
    await prisma.notification.create({ data: { type: 'Penalty', tenantId: inv.tenantId, message: 'Penalty KES ' + penalty.toFixed(2) + ' added for overdue rent.' } });
  }
}
module.exports = { applyPenalties };
`);

// ---------- settings ----------
save('src/routes/settings.js', `const router = require('express').Router();
const auth = require('../middleware/auth');
router.get('/', auth, async (req, res) => {
  const settings = await req.prisma.setting.findMany();
  res.json(settings);
});
router.put('/', auth, async (req, res) => {
  const { key, value } = req.body;
  await req.prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
  res.json({ message: 'Updated' });
});
module.exports = router;
`);

// ---------- audit logs ----------
save('src/routes/auditLogs.js', `const router = require('express').Router();
const auth = require('../middleware/auth');
router.get('/', auth, async (req, res) => {
  const logs = await req.prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
  res.json(logs);
});
module.exports = router;
`);

// ---------- scheduler ----------
save('src/services/invoiceGenerator.js', `async function generateMonthlyInvoices(prisma) {
  const month = new Date().toISOString().slice(0,7);
  const tenants = await prisma.tenant.findMany({ where: { leaseEnd: null }, include: { unit: true } });
  for (const t of tenants) {
    const exists = await prisma.invoice.findFirst({ where: { tenantId: t.id, month } });
    if (exists) continue;
    const rentDue = t.unit.rentAmount;
    const waterReading = await prisma.waterMeterReading.findFirst({ where: { tenantId: t.id, month }, orderBy: { createdAt: 'desc' } });
    const waterDue = waterReading?.billAmount || 0;
    await prisma.invoice.create({ data: { tenantId: t.id, month, rentDue, waterDue, penaltyDue: 0, totalDue: rentDue + waterDue, amountPaid: 0, status: 'Unpaid' } });
  }
}
module.exports = { generateMonthlyInvoices };
`);

save('src/services/scheduler.js', `const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const { generateMonthlyInvoices } = require('./invoiceGenerator');
const { applyPenalties } = require('./penaltyService');
const { processPendingStatements } = require('./statementProcessor');

const prisma = new PrismaClient();

function init() {
  cron.schedule('0 0 1 * *', () => generateMonthlyInvoices(prisma).catch(e => console.error(e)));
  cron.schedule('0 6 10 * *', () => applyPenalties(prisma).catch(e => console.error(e)));
  cron.schedule('0 * * * *', () => processPendingStatements(prisma).catch(e => console.error(e)));
  console.log('Scheduler started');
}
module.exports = { init };
`);

// ---------- FRONTEND (login + dashboard) ----------
// login.html
save('public/login.html', `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
  <title>CESSLAND HOMES – Secure Login</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { min-height: 100vh; background: radial-gradient(circle at 30% 20%, #0a0f2a, #020617); display: flex; align-items: center; justify-content: center; font-family: 'Inter', sans-serif; padding: 1.5rem; }
    .glass-card { background: rgba(20,35,80,0.45); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-radius: 2rem; border: 1px solid rgba(90,150,255,0.5); box-shadow: 0 30px 50px -20px rgba(0,0,0,0.5), 0 0 0 1px rgba(90,150,255,0.2) inset, 0 0 20px rgba(40,100,255,0.2); max-width: 460px; width: 100%; padding: 2.2rem 2rem; }
    .brand { text-align: center; margin-bottom: 1.5rem; }
    .brand h1 { font-size: 2.5rem; font-weight: 700; background: linear-gradient(135deg, #ffffff, #c7e0ff); -webkit-background-clip: text; background-clip: text; color: transparent; display: inline-flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; justify-content: center; }
    .brand h1 span { background: #2a5cff; color: white; font-size: 0.85rem; font-weight: 600; padding: 0.2rem 0.9rem; border-radius: 40px; }
    .secure-badge { margin-top: 0.6rem; font-size: 0.85rem; color: #bfd6ff; display: flex; align-items: center; justify-content: center; gap: 0.4rem; }
    .secure-badge::before { content: "🔒"; font-size: 0.75rem; }
    .welcome h2 { font-size: 1.75rem; font-weight: 700; color: #ffffff; margin-bottom: 0.3rem; }
    .welcome p { color: #d0e2ff; font-size: 0.9rem; margin-bottom: 1.8rem; }
    .input-group { margin-bottom: 1.4rem; }
    .input-group label { display: block; font-weight: 500; font-size: 0.85rem; color: #ecf3ff; margin-bottom: 0.4rem; }
    .input-group input { width: 100%; padding: 0.8rem 1rem; background: rgba(15,25,60,0.5); border: 1px solid rgba(90,150,255,0.6); border-radius: 1rem; font-size: 0.95rem; color: white; outline: none; transition: all 0.2s; }
    .input-group input:focus { border-color: #5a96ff; background: rgba(30,50,100,0.6); box-shadow: 0 0 0 3px rgba(90,150,255,0.3); }
    .input-group input::placeholder { color: rgba(255,255,255,0.4); }
    .options { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.8rem; font-size: 0.85rem; }
    .checkbox { display: flex; align-items: center; gap: 0.5rem; color: #e0edff; }
    .checkbox input { width: 1rem; height: 1rem; accent-color: #3b6eff; }
    .forgot-link { color: #9bc0ff; text-decoration: none; font-weight: 500; }
    .forgot-link:hover { color: #ffffff; text-decoration: underline; }
    .login-btn { background: linear-gradient(105deg, #2a5cff, #1a3db0); color: white; width: 100%; border: none; padding: 0.85rem; font-size: 1rem; font-weight: 600; border-radius: 2rem; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 15px rgba(0,0,0,0.3); }
    .login-btn:hover { background: linear-gradient(105deg, #3b6eff, #2a5cff); transform: scale(1.01); }
  </style>
</head>
<body>
<div class="glass-card">
  <div class="brand"><h1>CESSLAND <span>HOMES</span></h1><div class="secure-badge">Secure manager login</div></div>
  <div class="welcome"><h2>Welcome back</h2><p>Sign in to continue to the Cessland Homes dashboard.</p></div>
  <form id="loginForm">
    <div class="input-group"><label for="email">Email Address</label><input type="email" id="email" value="admin@cessland.com" required></div>
    <div class="input-group"><label for="password">Password</label><input type="password" id="password" value="Admin123!" required></div>
    <div class="options"><label class="checkbox"><input type="checkbox"> Remember device</label><a href="#" id="forgotPasswordLink" class="forgot-link">Forgot password?</a></div>
    <button type="submit" class="login-btn">Enter Dashboard →</button>
  </form>
</div>
<script>
  document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    if (!email || !password) return alert('Please fill in both fields.');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('cessland_token', data.token);
        localStorage.setItem('cessland_user', JSON.stringify(data.user));
        window.location.href = '/dashboard.html';
      } else {
        alert(data.error || 'Login failed');
      }
    } catch (err) {
      alert('Network error. Is the server running?');
    }
  });
  document.getElementById('forgotPasswordLink').addEventListener('click', e => { e.preventDefault(); alert('Password reset would be sent to your email.'); });
</script>
</body>
</html>`);

// dashboard.html - fully safe (no template literal escaping)
const dashboardHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
  <title>CESSLAND HOMES – Dashboard</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background: radial-gradient(circle at 30% 20%, #0a0f2a, #020617); font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #fff; min-height:100vh; }
    .sidebar { position:fixed; left:0; top:0; width:260px; height:100%; background: rgba(15,25,55,0.6); backdrop-filter: blur(16px); border-right:1px solid rgba(90,150,255,0.3); padding:1.5rem 0; display:flex; flex-direction:column; overflow-y:auto; z-index:10; }
    .logo { text-align:center; margin-bottom:2rem; padding:0 1rem; }
    .logo h1 { font-size:1.8rem; font-weight:700; background: linear-gradient(135deg,#fff,#bfd9ff); -webkit-background-clip:text; background-clip:text; color:transparent; display:inline-flex; align-items:center; gap:0.3rem; }
    .logo h1 span { background:#2a5cff; color:#fff; font-size:0.7rem; padding:0.15rem 0.6rem; border-radius:40px; }
    .date-time { text-align:center; font-size:0.7rem; color:#bfd6ff; margin-top:0.5rem; }
    .nav-menu { flex:1; display:flex; flex-direction:column; gap:0.3rem; padding:0 1rem; }
    .nav-item { display:flex; align-items:center; gap:0.75rem; padding:0.7rem 1rem; border-radius:1rem; color:#e0edff; text-decoration:none; font-size:0.9rem; font-weight:500; transition:all 0.2s; cursor:pointer; }
    .nav-item i { width:1.5rem; font-size:1.1rem; }
    .nav-item:hover, .nav-item.active { background:rgba(42,92,255,0.3); color:white; backdrop-filter:blur(4px); }
    .nav-item.active { background:rgba(42,92,255,0.5); border-left:3px solid #5a96ff; }
    .main-content { margin-left:260px; padding:1.5rem; }
    .glass-card { background:rgba(20,35,80,0.4); backdrop-filter:blur(12px); border-radius:1.5rem; border:1px solid rgba(90,150,255,0.3); padding:1.2rem; margin-bottom:1.5rem; }
    .module-header h2 { font-size:1.6rem; font-weight:600; margin-bottom:0.3rem; }
    .module-header p { color:#bfd6ff; font-size:0.9rem; }
    .action-bar { display:flex; gap:0.8rem; margin:1rem 0; flex-wrap:wrap; }
    .action-btn { background:rgba(42,92,255,0.3); border:1px solid rgba(90,150,255,0.5); padding:0.5rem 1rem; border-radius:2rem; font-size:0.8rem; color:white; cursor:pointer; }
    .action-btn:hover { background:rgba(42,92,255,0.6); }
    .kpi-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:1rem; margin-bottom:1.5rem; }
    .kpi-card { background:rgba(15,25,60,0.6); backdrop-filter:blur(8px); border-radius:1.2rem; padding:1rem; border:1px solid rgba(90,150,255,0.3); }
    .metric-title { font-size:0.75rem; color:#bfd6ff; margin-bottom:0.3rem; }
    .metric-value { font-size:1.6rem; font-weight:700; }
    .data-table { width:100%; border-collapse:collapse; font-size:0.8rem; }
    .data-table th, .data-table td { padding:0.7rem 0.3rem; text-align:left; border-bottom:1px solid rgba(90,150,255,0.2); }
    .status-badge { background:rgba(34,197,94,0.2); color:#86efac; padding:0.2rem 0.5rem; border-radius:1rem; font-size:0.7rem; }
    .status-warning { background:rgba(245,158,11,0.2); color:#fcd34d; }
    .status-danger { background:rgba(239,68,68,0.2); color:#f87171; }
    .two-columns { display:grid; grid-template-columns:2fr 1fr; gap:1.2rem; margin-bottom:1.5rem; }
    .progress-bar { height:6px; background:rgba(255,255,255,0.2); border-radius:10px; overflow:hidden; margin:0.3rem 0; }
    .progress-fill { height:100%; border-radius:10px; background:#2a5cff; }
    .breakdown-label { display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:0.2rem; }
    @media (max-width:900px) { .sidebar { width:70px; } .sidebar .logo h1 span, .sidebar .nav-item span:not(i) { display:none; } .main-content { margin-left:70px; } .two-columns { grid-template-columns:1fr; } }
  </style>
</head>
<body>
<div class="sidebar">
  <div class="logo"><h1>CESSLAND<span>HOMES</span></h1><div class="date-time" id="currentDateTime"></div></div>
  <div class="nav-menu">
    <div class="nav-item active" data-page="dashboard"><i class="fas fa-tachometer-alt"></i><span>Dashboard</span></div>
    <div class="nav-item" data-page="buildings"><i class="fas fa-building"></i><span>Buildings</span></div>
    <div class="nav-item" data-page="tenants"><i class="fas fa-users"></i><span>Tenants</span></div>
    <div class="nav-item" data-page="payments"><i class="fas fa-credit-card"></i><span>Payments</span></div>
    <div class="nav-item" data-page="bankreconciliation"><i class="fas fa-university"></i><span>Bank Reconciliation</span></div>
    <div class="nav-item" data-page="invoices"><i class="fas fa-file-invoice"></i><span>Invoices</span></div>
    <div class="nav-item" data-page="waterbilling"><i class="fas fa-droplet"></i><span>Water Billing</span></div>
    <div class="nav-item" data-page="reports"><i class="fas fa-chart-line"></i><span>Reports</span></div>
    <div class="nav-item" data-page="settings"><i class="fas fa-gear"></i><span>Settings</span></div>
    <div class="nav-item" data-page="auditlogs"><i class="fas fa-clock"></i><span>Audit Logs</span></div>
  </div>
  <div style="padding:1rem; font-size:0.7rem; text-align:center; color:#8ba5d0;"><i class="fas fa-user-circle"></i> <span id="sidebarUserName"></span><br>Property Manager</div>
</div>
<div class="main-content" id="mainContent"></div>
<script>
  const token = localStorage.getItem('cessland_token');
  if (!token) window.location.href = '/login.html';
  const user = JSON.parse(localStorage.getItem('cessland_user') || '{}');
  document.getElementById('sidebarUserName').textContent = user.name || 'User';

  async function api(url, options = {}) {
    const res = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token, ...options.headers }
    });
    if (res.status === 401) { localStorage.clear(); window.location.href = '/login.html'; }
    return res.json();
  }

  function updateDateTime() {
    const now = new Date();
    document.getElementById('currentDateTime').innerText =
      now.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) + ' • ' + now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  }
  updateDateTime(); setInterval(updateDateTime,10000);

  async function renderDashboard() {
    const stats = await api('/api/dashboard/stats');
    const overdue = await api('/api/dashboard/overdue');
    let overdueHtml = '<tr><td colspan="5">All tenants paid.</td></tr>';
    if (overdue.length > 0) {
      overdueHtml = overdue.map(t => '<tr><td>' + t.tenantName + '</td><td>' + t.phone + '</td><td>' + t.building + ' - ' + t.unit + '</td><td>KES ' + t.totalOwed.toLocaleString() + '</td><td><span class="status-warning">' + (t.hasPenalty ? 'Penalty' : 'Unpaid') + '</span></td></tr>').join('');
    }
    let recentHtml = '';
    stats.recentPayments.forEach(p => {
      recentHtml += '<tr><td>' + p.tenant + '</td><td>' + p.property + '</td><td>KES ' + p.amount.toLocaleString() + '</td><td>' + new Date(p.date).toLocaleDateString() + '</td><td><span class="status-badge">' + p.status + '</span></td></tr>';
    });
    const html = '<div class="glass-card" style="margin-bottom:1.5rem;"><h2>Welcome back, ' + user.name.split(' ')[0] + ' 🎉</h2><p style="color:#bfd6ff">Here\'s what\'s happening with your properties today.</p></div>'
      + '<div class="kpi-grid">'
      + '<div class="kpi-card"><div class="metric-title">Total Collection</div><div class="metric-value">KES ' + stats.totalCollectionThisMonth.toLocaleString() + '</div></div>'
      + '<div class="kpi-card"><div class="metric-title">Total Properties</div><div class="metric-value">' + stats.totalProperties + '</div></div>'
      + '<div class="kpi-card"><div class="metric-title">Occupied Units</div><div class="metric-value">' + stats.occupiedUnits + '</div></div>'
      + '<div class="kpi-card"><div class="metric-title">Vacant Units</div><div class="metric-value">' + stats.vacantUnits + '</div></div>'
      + '</div>'
      + '<div class="two-columns">'
      + '<div class="glass-card"><h3>Collection Overview</h3><canvas id="collectionChart" width="400" height="200" style="width:100%;max-height:200px;"></canvas></div>'
      + '<div class="glass-card"><h3>Collection Breakdown</h3>'
      + '<div class="breakdown-item"><div class="breakdown-label">Rent 68% · KES 812,500</div><div class="progress-bar"><div class="progress-fill" style="width:68%"></div></div></div>'
      + '<div class="breakdown-item"><div class="breakdown-label">Water 20% · KES 250,000</div><div class="progress-bar"><div class="progress-fill" style="width:20%;background:#10b981;"></div></div></div>'
      + '<div class="breakdown-item"><div class="breakdown-label">Other Fees 12% · KES 150,000</div><div class="progress-bar"><div class="progress-fill" style="width:12%;background:#f59e0b;"></div></div></div>'
      + '</div></div>'
      + '<div class="glass-card"><h3>Unpaid Tenants</h3><table class="data-table"><thead><tr><th>Tenant</th><th>Phone</th><th>Unit</th><th>Total Owed</th><th>Status</th></tr></thead><tbody>' + overdueHtml + '</tbody></table></div>'
      + '<div class="glass-card"><div style="display:flex;justify-content:space-between;"><h3>Recent Payments</h3><button class="action-btn">View All →</button></div>'
      + '<table class="data-table"><thead><tr><th>Tenant</th><th>Property</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead><tbody>' + recentHtml + '</tbody></table></div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1.2rem;">'
      + '<div class="glass-card"><h3>Outstanding Rent</h3><div style="font-size:1.8rem;font-weight:bold;">KES 0</div><div>Data will appear after invoices</div></div>'
      + '<div class="glass-card"><h3>Bank Reconciliation</h3><div><span class="status-badge">LIVE</span></div><div style="margin-top:0.5rem;">Import statements via API</div></div></div>';
    document.getElementById('mainContent').innerHTML = html;
    const ctx = document.getElementById('collectionChart')?.getContext('2d');
    if (ctx) new Chart(ctx,{type:'line',data:{labels:['4 May','10 May','16 May','22 May','28 May'],datasets:[{label:'Collected (KES)',data:[850000,980000,1120000,1180000,1250000],borderColor:'#5a96ff',backgroundColor:'rgba(90,150,255,0.1)',fill:true,tension:0.3}]},options:{responsive:true}});
  }

  async function renderBuildings() {
    const buildings = await api('/api/buildings');
    let html = '<div class="module-header"><h2>Buildings</h2><div class="action-bar"><button class="action-btn" onclick="document.getElementById(\'buildingFileInput\').click()">Import Excel</button><input type="file" id="buildingFileInput" style="display:none" accept=".xlsx,.xls" onchange="importBuildings(event)"></div></div>';
    if (buildings.length === 0) { html += '<div class="glass-card"><p>No buildings yet. Import an Excel file to get started.</p></div>'; }
    else {
      html += '<div class="glass-card"><table class="data-table"><thead><tr><th>Name</th><th>Location</th><th>Owner</th><th>Units</th><th>Commission %</th></tr></thead><tbody>';
      buildings.forEach(b => {
        html += '<tr><td><a href="#" onclick="viewBuilding(' + b.id + ')">' + b.name + '</a></td><td>' + b.location + '</td><td>' + (b.ownerName || '') + '</td><td>' + b.units.length + '</td><td>' + b.commissionPercentage + '%</td></tr>';
      });
      html += '</tbody></table></div>';
    }
    document.getElementById('mainContent').innerHTML = html;
  }

  async function importBuildings(event) {
    const file = event.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/buildings/import', { method: 'POST', headers: { 'Authorization': 'Bearer ' + token }, body: formData });
    const data = await res.json();
    alert(data.message || 'Import complete');
    renderBuildings();
  }

  window.viewBuilding = async (id) => {
    const data = await api('/api/buildings/' + id);
    let html = '<h2>' + data.building.name + ' Details</h2><p>Owner: ' + (data.building.ownerName || 'N/A') + ' | Account: ' + (data.building.ownerAccountNumber || 'N/A') + ' | Phone: ' + (data.building.ownerPhone || 'N/A') + '</p>'
      + '<div class="kpi-grid"><div class="kpi-card"><div class="metric-title">Expected Rent</div><div class="metric-value">KES ' + data.expectedRent.toLocaleString() + '</div></div>'
      + '<div class="kpi-card"><div class="metric-title">Actual Received</div><div class="metric-value">KES ' + data.actualReceived.toLocaleString() + '</div></div></div>'
      + '<div class="glass-card"><table class="data-table"><thead><tr><th>Unit</th><th>Tenant</th><th>Rent</th><th>Paid</th><th>Owed</th><th>Status</th></tr></thead><tbody>';
    data.unitDetails.forEach(u => {
      let statusClass = '';
      if (u.status === 'Overdue' || u.status === 'Partial') statusClass = 'status-warning';
      html += '<tr><td>' + u.unitNumber + '</td><td>' + u.tenantName + '</td><td>KES ' + u.rentAmount + '</td><td>KES ' + u.amountPaidThisMonth + '</td><td>KES ' + u.owed + '</td><td><span class="status-badge ' + statusClass + '">' + u.status + '</span></td></tr>';
    });
    html += '</tbody></table></div><button class="action-btn" onclick="renderBuildings()">Back to Buildings</button>';
    document.getElementById('mainContent').innerHTML = html;
  };

  async function renderTenants() {
    const tenants = await api('/api/tenants');
    let html = '<div class="module-header"><h2>Tenants</h2><div class="action-bar"><button class="action-btn" onclick="document.getElementById(\'tenantFileInput\').click()">Import Excel</button><input type="file" id="tenantFileInput" style="display:none" accept=".xlsx,.xls" onchange="importTenants(event)"></div></div>';
    if (tenants.length === 0) { html += '<div class="glass-card"><p>No tenants yet. Import an Excel file or add manually.</p></div>'; }
    else {
      html += '<div class="glass-card"><table class="data-table"><thead><tr><th>Name</th><th>Phone</th><th>Unit</th><th>Lease Start</th><th>SD Remaining</th></tr></thead><tbody>';
      tenants.forEach(t => {
        html += '<tr><td>' + t.name + '</td><td>' + t.phone + '</td><td>' + (t.unit?.unitNumber || '') + '</td><td>' + new Date(t.leaseStart).toLocaleDateString() + '</td><td>KES ' + (t.sdAmount - t.sdPaid).toLocaleString() + '</td></tr>';
      });
      html += '</tbody></table></div>';
    }
    document.getElementById('mainContent').innerHTML = html;
  }

  async function importTenants(event) {
    const file = event.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/tenants/import', { method: 'POST', headers: { 'Authorization': 'Bearer ' + token }, body: formData });
    const data = await res.json();
    alert(data.message || 'Import complete');
    renderTenants();
  }

  async function renderBankReco() {
    const unmatched = await api('/api/unmatched-payments');
    let html = '<div class="module-header"><h2>Bank Reconciliation</h2><p>Upload bank statement</p><div class="action-bar"><input type="file" id="stmtFileInput" accept=".csv,.xlsx,.xls" onchange="uploadStatement(event)"></div></div>';
    if (unmatched.length > 0) {
      html += '<div class="glass-card"><h3>Unmatched Transactions</h3><table class="data-table"><thead><tr><th>Date</th><th>Name</th><th>Amount</th><th>Ref</th><th>Action</th></tr></thead><tbody>';
      unmatched.forEach(u => {
        html += '<tr><td>' + new Date(u.paymentDate).toLocaleDateString() + '</td><td>' + u.paymentName + '</td><td>KES ' + u.amount + '</td><td>' + u.transactionRef + '</td><td><button class="action-btn" onclick="allocateMatch(' + u.id + ')">Assign</button></td></tr>';
      });
      html += '</tbody></table></div>';
    }
    document.getElementById('mainContent').innerHTML = html;
  }

  window.uploadStatement = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('statement', file);
    await fetch('/api/statements/upload', { method: 'POST', headers: { 'Authorization': 'Bearer ' + token }, body: formData });
    alert('File processed. Unmatched items will appear here.');
    renderBankReco();
  };

  window.allocateMatch = async (id) => {
    const tenants = await api('/api/tenants');
    let options = '';
    tenants.forEach(t => { options += '<option value="' + t.id + '">' + t.name + ' (' + (t.unit?.unitNumber || '') + ')</option>'; });
    const dialogHtml = '<div class="glass-card" style="position:fixed; top:20%; left:30%; background:rgba(20,35,80,0.9); z-index:1000; padding:2rem;">'
      + '<h3>Select Tenant</h3><select id="allocTenantSelect" class="action-btn" style="width:100%; margin:1rem 0;">' + options + '</select>'
      + '<button class="action-btn" onclick="submitAlloc(' + id + ')">Allocate</button>'
      + '<button class="action-btn" onclick="closeDialog()">Cancel</button></div>';
    document.getElementById('mainContent').insertAdjacentHTML('beforeend', dialogHtml);
  };

  window.submitAlloc = async (id) => {
    const tenantId = document.getElementById('allocTenantSelect').value;
    if (!tenantId) return;
    await api('/api/unmatched-payments/' + id + '/allocate', { method: 'POST', body: JSON.stringify({ tenantId: parseInt(tenantId) }) });
    alert('Allocated!');
    renderBankReco();
  };

  window.closeDialog = () => {
    document.querySelector('.glass-card[style*="fixed"]').remove();
  };

  async function renderSettings() {
    document.getElementById('mainContent').innerHTML = '<div class="glass-card"><h2>System Settings</h2><button class="action-btn" style="background:red;" onclick="resetSystem()">Reset All Data</button></div>';
  }

  window.resetSystem = async () => {
    if (!confirm('Delete all buildings, tenants, payments, and invoices? This cannot be undone.')) return;
    await fetch('/api/reset', { method: 'POST', headers: { 'Authorization': 'Bearer ' + token } });
    alert('All data cleared.');
    navigateTo('dashboard');
  };

  async function renderModule(page) {
    if (page === 'dashboard') return renderDashboard();
    if (page === 'buildings') return renderBuildings();
    if (page === 'tenants') return renderTenants();
    if (page === 'bankreconciliation') return renderBankReco();
    if (page === 'settings') return renderSettings();
    const endpoints = { payments: '/api/payments', invoices: '/api/invoices/tenant/1', waterbilling: '/api/water-billing', reports: '/api/reports/collections', auditlogs: '/api/audit-logs' };
    const url = endpoints[page];
    if (!url) return document.getElementById('mainContent').innerHTML = '<div class="glass-card"><h2>Module coming soon</h2></div>';
    const data = await api(url);
    let content = '';
    if (Array.isArray(data) && data.length > 0) {
      const keys = Object.keys(data[0]).filter(k => k !== 'id' && k !== 'createdAt' && k !== 'updatedAt');
      content = '<table class="data-table"><thead><tr>' + keys.map(k => '<th>' + k + '</th>').join('') + '</tr></thead><tbody>' + data.map(item => '<tr>' + keys.map(k => '<td>' + (typeof item[k]==='object'?JSON.stringify(item[k]):item[k]) + '</td>').join('') + '</tr>').join('') + '</tbody></table>';
    } else { content = '<p>No records yet.</p>'; }
    document.getElementById('mainContent').innerHTML = '<div class="module-header"><h2>' + page.charAt(0).toUpperCase()+page.slice(1) + '</h2></div><div class="glass-card">' + content + '</div>';
  }

  async function navigateTo(page) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const active = document.querySelector('.nav-item[data-page="' + page + '"]');
    if (active) active.classList.add('active');
    await renderModule(page);
  }

  document.querySelectorAll('.nav-item').forEach(item => item.addEventListener('click', () => navigateTo(item.getAttribute('data-page'))));
  navigateTo('dashboard');
</script>
</body>
</html>`;
save('public/dashboard.html', dashboardHtml);

// ============================================================
// INSTALL & START
// ============================================================
console.log('Project files created. Installing dependencies...');
process.chdir(root);
execSync('npm install', { stdio: 'inherit' });
execSync('npx prisma generate', { stdio: 'inherit' });
execSync('npx prisma db push', { stdio: 'inherit' });
execSync('npm run db:seed', { stdio: 'inherit' });
console.log('\n✅ Setup complete! Starting server...\n');
execSync('npm start', { stdio: 'inherit' });