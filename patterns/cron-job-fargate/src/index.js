import { processJob } from './domains/index.js';

const CURRENT_DOMAIN = process.env.DOMAIN;

const start = async () => {
  console.log('Starting cron job...');
  await processJob(CURRENT_DOMAIN);
  console.log('Cron job completed successfully');

  process.exit(0);
};

start();