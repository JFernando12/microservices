import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from '@aws-sdk/client-sqs';
import ProtectionManager from './lib/protection-manager.js';
import { proccesEventDomain1 } from './domain1/index.js';
import { proccesEventDomain2 } from './domain2/index.js';

const sqs = new SQSClient();

const TaskProtection = new ProtectionManager({
  desiredProtectionDurationInMins: 1,
  maintainProtectionPercentage: 10,
  refreshProtectionPercentage: 80,
  protectionAdjustIntervalInMs: 10 * 1000,
});

const domainsConfig = [
  {
    domain: 'domain1',
    MaxNumberOfMessages: 1,
    WaitTimeSeconds: 20,
    VisibilityTimeout: 60 * 60,
    fn: proccesEventDomain1,
  },
  {
    domain: 'domain2',
    MaxNumberOfMessages: 10,
    WaitTimeSeconds: 10,
    VisibilityTimeout: 60 * 60,
    fn: proccesEventDomain2,
  },
];

export const processEvents = async (currentDomain) => {
  await TaskProtection.acquire();

  const domain = domainsConfig.find((d) => d.domain === currentDomain);

  if (!domain) {
    throw new Error('Invalid domain');
  }

  const receiveMessageResponse = await sqs.send(
    new ReceiveMessageCommand({
      QueueUrl: QUEUE_URL,
      MaxNumberOfMessages: 1,
      WaitTimeSeconds: 20,
      VisibilityTimeout: ONE_HOUR_IN_SECONDS,
    })
  );

  const messages = receiveMessageResponse.Messages;

  if (messages?.length === 0) {
    console.log('No messages available');
    return;
  }
  console.log('Received messages:', messages.length);

  for (const message of messages) {
    try {
      await domain.fn(message);
      
      await sqs.send(
        new DeleteMessageCommand({
          QueueUrl: QUEUE_URL,
          ReceiptHandle: handle,
        })
      );
    } catch (e) {
      console.error('Failed to process message', e.toString());
    }
  }
  
  await TaskProtection.release();
}