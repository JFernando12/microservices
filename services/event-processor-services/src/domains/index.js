import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from '@aws-sdk/client-sqs';
import { processEventDomain1 } from './domain1/index.js';
import { processEventDomain2 } from './domain2/index.js';

const sqs = new SQSClient({ region: 'us-east-1'});

const domainsConfig = [
  {
    domain: 'domain1',
    MaxNumberOfMessages: 1,
    WaitTimeSeconds: 20,
    VisibilityTimeout: 60 * 60,
    fn: processEventDomain1,
  },
  {
    domain: 'domain2',
    MaxNumberOfMessages: 5,
    WaitTimeSeconds: 20,
    VisibilityTimeout: 60 * 60,
    fn: processEventDomain2,
  },
];

export const processEvents = async (currentDomain, queueUrl) => {
  const domain = domainsConfig.find((d) => d.domain === currentDomain);

  if (!domain) {
    throw new Error('Invalid domain');
  }

  const receiveMessageResponse = await sqs.send(
    new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: domain.MaxNumberOfMessages,
      WaitTimeSeconds: domain.WaitTimeSeconds,
      VisibilityTimeout: domain.VisibilityTimeout,
    })
  );
  console.log('Receive message response: ', receiveMessageResponse);

  const messages = receiveMessageResponse.Messages;
  console.log('Messages: ', messages);

  if (!messages || messages?.length === 0) {
    console.log('No messages available');
    return;
  }
  console.log('Received messages:', messages.length);

  const promises = messages.map((message) => {
    return processMessage(domain.fn, message);
  });

  await Promise.all(promises);  
}

const processMessage = async (fn, message) => {
  console.log(`${message.MessageId} - Received`);

  try {
    await fn(message);

    await sqs.send(
      new DeleteMessageCommand({
        QueueUrl: queueUrl,
        ReceiptHandle: message.ReceiptHandle
      })
    );

    console.log(`${message.MessageId} - Done`);
  } catch (error) {
    console.error(`${message.MessageId} - Error:`, error);
  }
}