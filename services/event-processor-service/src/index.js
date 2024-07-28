const QUEUE_URL = process.env.QUEUE_URL;
const CURRENT_DOMAIN = process.env.DOMAIN;

if (!QUEUE_URL) {
  throw new Error('QUEUE_URL environment variable must be set');
};

if (!CURRENT_DOMAIN) {
  throw new Error('DOMAIN environment variable must be set');
};

let timeToQuit = false;

function maybeContinuePolling() {
  if (timeToQuit) {
    console.log('Exiting as requested');
    process.exit(0);
  } else {
    setImmediate(pollForWork);
  }
}

// Acquire task protection, grab a message, and then release protection
async function pollForWork() {

  return maybeContinuePolling();
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

setImmediate(pollForWork);
