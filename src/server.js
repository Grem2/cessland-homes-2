const app = require('./app');
const connectDb = require('./config/db');
const { port, validateEnv } = require('./config/env');
const scheduler = require('./services/schedulerService');

async function start() {
  validateEnv();
  await connectDb();
  scheduler.init();

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
