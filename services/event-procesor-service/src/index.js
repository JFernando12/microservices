import AWS from 'aws-sdk';
const sqs = new AWS.SQS();

const QUEUE_URL = process.env.QUEUE_URL;
const DOMAIN = process.env.DOMAIN;

async function processEvent() {
  const params = {
    QueueUrl: QUEUE_URL,
    MaxNumberOfMessages: 10,
  };

  const data = await sqs.receiveMessage(params).promise();
  if (data.Messages) {
    for (const message of data.Messages) {
      const event = JSON.parse(message.Body);
      if (event.domain === DOMAIN) {
        console.log(`Processing event for ${DOMAIN}:`, event);
        // Process the event...

        // Delete the message
        await sqs.deleteMessage({
          QueueUrl: QUEUE_URL,
          ReceiptHandle: message.ReceiptHandle,
        }).promise();
      }
    }
  }
}

processEvent().catch(console.error);
