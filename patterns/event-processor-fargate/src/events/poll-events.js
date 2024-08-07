
import ProtectionManager from '../lib/protection-manager.js';
import { QUEUE_URL, CURRENT_DOMAIN } from "../config/envs.js";
import { processEvents } from './process-events.js';

const TaskProtection = new ProtectionManager({
  desiredProtectionDurationInMins: 1,
  maintainProtectionPercentage: 10,
  refreshProtectionPercentage: 80,
  protectionAdjustIntervalInMs: 10 * 1000,
});

if (!QUEUE_URL) {
  throw new Error('QUEUE_URL environment variable must be set');
};

if (!CURRENT_DOMAIN) {
  throw new Error('DOMAIN environment variable must be set');
};

let timeToQuit = false;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const pollEvents = async () => {
  console.log('Current domain:', CURRENT_DOMAIN);
  await TaskProtection.acquire();
  await processEvents(CURRENT_DOMAIN, QUEUE_URL);
  await delay(3000);
  await TaskProtection.release();
  return maybeContinuePolling();
}

const maybeContinuePolling = () => {
  if (timeToQuit) {
    console.log('Exiting as requested');
    process.exit(0);
  }
    
  setImmediate(pollEvents);
}

process.on('SIGTERM', () => {
  console.log('Received SIGTERM signal, will quit when all work is done');
  timeToQuit = true;
});

TaskProtection.on('rejected', (e) => {
  if (e.response && e.response.body) {
    console.log('Failed to acquire task protection because ', e.response.body);
  } else {
    console.log('Failed to acquire task protection because ', e.toString());
  }
  timeToQuit = true;
});

TaskProtection.on('unprotected', (e) => {
  console.log('Task protection released');
});