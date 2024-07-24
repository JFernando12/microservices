import AWS from 'aws-sdk';
const ecs = new AWS.ECS();
const sqs = new AWS.SQS();

const CLUSTER_NAME = process.env.CLUSTER_NAME;
const SERVICE_NAME_DOMAIN1 = process.env.SERVICE_NAME_DOMAIN1;
const SERVICE_NAME_DOMAIN2 = process.env.SERVICE_NAME_DOMAIN2;
const QUEUE_URL_DOMAIN1 = process.env.QUEUE_URL_DOMAIN1;
const QUEUE_URL_DOMAIN2 = process.env.QUEUE_URL_DOMAIN2;

exports.handler = async () => {
  const attributesDomain1 = await sqs.getQueueAttributes({
    QueueUrl: QUEUE_URL_DOMAIN1,
    AttributeNames: ['ApproximateNumberOfMessages'],
  }).promise();

  const attributesDomain2 = await sqs.getQueueAttributes({
    QueueUrl: QUEUE_URL_DOMAIN2,
    AttributeNames: ['ApproximateNumberOfMessages'],
  }).promise();

  const queueLengthDomain1 = parseInt(attributesDomain1.Attributes.ApproximateNumberOfMessages, 10);
  const queueLengthDomain2 = parseInt(attributesDomain2.Attributes.ApproximateNumberOfMessages, 10);

  const desiredCountDomain1 = queueLengthDomain1 > 0 ? Math.ceil(queueLengthDomain1 / 10) : 0;
  const desiredCountDomain2 = queueLengthDomain2 > 0 ? Math.ceil(queueLengthDomain2 / 10) : 0;

  await ecs.updateService({
    cluster: CLUSTER_NAME,
    service: SERVICE_NAME_DOMAIN1,
    desiredCount: desiredCountDomain1,
  }).promise();

  await ecs.updateService({
    cluster: CLUSTER_NAME,
    service: SERVICE_NAME_DOMAIN2,
    desiredCount: desiredCountDomain2,
  }).promise();

  console.log(`Scaled services to desired counts: ${desiredCountDomain1} for domain1, ${desiredCountDomain2} for domain2`);
};
