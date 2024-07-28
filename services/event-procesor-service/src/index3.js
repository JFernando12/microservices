import AWS from 'aws-sdk';

const QUEUE_URL_DOMAIN1 = process.env.QUEUE_URL_DOMAIN1;

const sqs = new AWS.SQS();

async function processEvent() {
  console.log('Processing events jiji');

  const params = {
    QueueUrl: QUEUE_URL_DOMAIN1,
    MaxNumberOfMessages: 10,
  };

  const data = await sqs.receiveMessage(params).promise();
  console.log('data:: ', data);
  if (data.Messages) {
    for (const message of data.Messages) {
      const event = message.Body;
      console.log(`Processing event for ${QUEUE_URL_DOMAIN1}:`, event);
      // Process the event...

      // Delete the message
      await sqs.deleteMessage({
        QueueUrl: QUEUE_URL_DOMAIN1,
        ReceiptHandle: message.ReceiptHandle,
      }).promise();
    }
  }

  console.log('Finished processing events');
}

setInterval(processEvent, 10000);
