import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from '@aws-sdk/client-sqs';
import ProtectionManager from './lib/protection-manager.js';
import { proccessEventDomain1 } from './domains/domain1/index.js';

const DOMAIN1 = 'domain1';
const DOMAIN2 = 'domain2';

const QUEUE_URL = process.env.QUEUE_URL;
const CURRENT_DOMAIN = process.env.DOMAIN;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const sqs = new SQSClient();

if (!QUEUE_URL) {
  throw new Error('QUEUE_URL environment variable must be set');
};

if (!CURRENT_DOMAIN) {
  throw new Error('DOMAIN environment variable must be set');
};

const TaskProtection = new ProtectionManager({
  desiredProtectionDurationInMins: 1,
  maintainProtectionPercentage: 10,
  refreshProtectionPercentage: 80,
  protectionAdjustIntervalInMs: 10 * 1000,
});

const ONE_HOUR_IN_SECONDS = 60 * 60;
let timeToQuit = false;

function maybeContinuePolling() {
  if (timeToQuit) {
    console.log('Exiting as requested');
    process.exit(0);
  } else {
    setImmediate(pollForWork);
  }
}

async function receiveMessage() {
  try {
    console.log('Long polling for messages');
    const receiveMessageResponse = await sqs.send(
      new ReceiveMessageCommand({
        QueueUrl: QUEUE_URL,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 20,
        VisibilityTimeout: ONE_HOUR_IN_SECONDS,
      })
    );

    const messages = receiveMessageResponse.Messages;
    if (!messages) {
      return;
    }

    return messages[0];
  } catch (e) {
    console.error('Failed to receive messages because ', e.toString());
    return;
  }
}

async function deleteMessage(handle) {
  try {
    await sqs.send(
      new DeleteMessageCommand({
        QueueUrl: QUEUE_URL,
        ReceiptHandle: handle,
      })
    );
  } catch (e) {
    console.error('Failed to delete handled message because ', e.toString());
  }
}

// Do the work for a single message.
async function processMessage(message) {

  switch (CURRENT_DOMAIN) {
    case DOMAIN1:
      return proccessEventDomain1(message, deleteMessage);
    case DOMAIN2:
      return processMessageForExample2(message);
    default:
      console.error('Unknown domain', DOMAIN);
  }
}

// Acquire task protection, grab a message, and then release protection
async function pollForWork() {
  const message = await receiveMessage();

  if (message) {
    console.log('Acquiring task protection');
    await TaskProtection.acquire();
    await processMessage(message);
    console.log('Releasing task protection');
    await TaskProtection.release();
  } else {
    console.log('No messages available');
    await delay(10000);
  }

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
