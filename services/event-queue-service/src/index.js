import AWS from 'aws-sdk';
const sqs = new AWS.SQS();

const QUEUE_URL_DOMAIN1 = process.env.QUEUE_URL_DOMAIN1;
const QUEUE_URL_DOMAIN2 = process.env.QUEUE_URL_DOMAIN2;

async function queueEvent() {
  // Proccess information for domain1
  const eventDomain1 = {
    QueueUrl: QUEUE_URL_DOMAIN1,
    MessageBody: JSON.stringify({ domain: 'domain1.com' }),
  };

  // Proccess information for domain2
  const eventDomain2 = {
    QueueUrl: QUEUE_URL_DOMAIN2,
    MessageBody: JSON.stringify({ domain: 'domain2.com' }),
  };

  await sqs.sendMessage(eventDomain1).promise();
  await sqs.sendMessage(eventDomain2).promise();

  console.log('Events queued successfully');
}

queueEvent().catch(console.error);
