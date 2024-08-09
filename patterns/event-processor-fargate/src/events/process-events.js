import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from '@aws-sdk/client-sqs';
import { microservices } from '../config/microservices.js';

const sqs = new SQSClient({ region: 'us-east-1'});

export const processEvents = async (currentDomain, queueUrl) => {
  const microservice = microservices.find((d) => d.domain === currentDomain);

  if (!microservice) {
    throw new Error('Invalid microservice');
  }

  const receiveMessageResponse = await sqs.send(
    new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: microservice.MaxNumberOfMessages,
      WaitTimeSeconds: microservice.WaitTimeSeconds,
      VisibilityTimeout: microservice.VisibilityTimeout,
    })
  );

  const messages = receiveMessageResponse.Messages;
  console.log('Received messages:', messages?.length);

  if (!messages || messages?.length === 0) {
    console.log('No messages available');
    return;
  }

  const promises = messages.map((message) => {
    return processMessage(microservice.fn, message, queueUrl);
  });

  await Promise.all(promises);  
}

const processMessage = async (fn, message, queueUrl) => {
  console.log(`${message.MessageId} - Received`);

  const body = JSON.parse(message.Body);

  try {
    await fn(body);
    
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