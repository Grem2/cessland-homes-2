require('dotenv').config();

const bcrypt = require('bcryptjs');
const connectDb = require('./config/db');
const { validateEnv } = require('./config/env');
const User = require('./models/User');

async function seed() {
  validateEnv();
  await connectDb();

  const password = await bcrypt.hash('Admin123!', 10);
  await User.findOneAndUpdate(
    { email: 'admin@cessland.com' },
    {
      email: 'admin@cessland.com',
      password,
      name: 'Super Admin',
      role: 'SuperAdmin'
    },
    { upsert: true, new: true }
  );

  console.log('Admin user ready: admin@cessland.com / Admin123!');
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
