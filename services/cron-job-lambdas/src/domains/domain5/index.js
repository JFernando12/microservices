import { MongoClient } from 'mongodb';
import { SQSClient, SendMessageBatchCommand } from '@aws-sdk/client-sqs';

console.log('Starting Domain 5 cron job...');
console.log('Processing IDs...');

const QUEUE_URL = process.env.QUEUE_URL;

console.log('Queue URL:', QUEUE_URL);

export const handler = async () => {
  const ids = Array.from({ length: 8 }, (_, i) => `id${i + 1}`); // Replace with your array of IDs

  const mongoUri = '';
  const client = new MongoClient(mongoUri,  {});

  // AWS SQS setup
  const sqsClient = new SQSClient({ region: 'us-east-1' });

  try {
    // Connect to MongoDB
    await client.connect();
    const database = client.db('your_database_name');
    const collection = database.collection('your_collection_name');

    // Step 1: Find non-existing IDs
    const existingDocs = await collection.find({ _id: { $in: ids } }).project({ _id: 1 }).toArray();
    const existingIds = existingDocs.map(doc => doc._id);
    const nonExistingIds = ids.filter(id => !existingIds.includes(id));

    if (nonExistingIds.length === 0) {
      console.log('All IDs already exist in the database.');
      return;
    }
    
    // Step 2: Insert new IDs into MongoDB
    const newDocs = nonExistingIds.map(id => ({ _id: id }));
    await collection.insertMany(newDocs);
    console.log('Inserted new IDs into MongoDB:', nonExistingIds);

    // Step 3: Send new IDs to AWS SQS in batches
    await sendIdsInBatchesToSqs(sqsClient, QUEUE_URL, nonExistingIds);
    
  } catch (error) {
    console.error('Error occurred:', error);
  } finally {
    // Close the MongoDB connection
    await client.close();
  }
}

async function sendIdsInBatchesToSqs(sqsClient, queueUrl, ids) {
  const maxBatchSize = 10; // SQS maximum batch size
  const maxMessageSize = 256 * 1024; // SQS maximum message size in bytes
  let batch = [];

  for (const id of ids) {
    const messageBody = JSON.stringify({ id });
    
    // Check if adding this message would exceed the batch size or message size
    if (batch.length >= maxBatchSize || (batch.length > 0 && Buffer.byteLength(messageBody) + Buffer.byteLength(batch.map(msg => msg.MessageBody).join('')) > maxMessageSize)) {
      // Send the current batch
      await sendBatchToSqs(sqsClient, queueUrl, batch);
      batch = [];
    }

    batch.push({
      Id: id,
      MessageBody: messageBody,
    });
  }

  // Send any remaining messages
  if (batch.length > 0) {
    await sendBatchToSqs(sqsClient, queueUrl, batch);
  }
}

async function sendBatchToSqs(sqsClient, queueUrl, batch) {
  const params = {
    QueueUrl: queueUrl,
    Entries: batch,
  };

  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const command = new SendMessageBatchCommand(params);
      const result = await sqsClient.send(command);
      if (result.Failed?.length > 0) {
        throw new Error('Failed to send some messages to SQS');
      }
      console.log('Sent messages to AWS SQS:', batch.map(msg => msg.Id));
      break;
    } catch (error) {
      console.error(`Attempt ${attempt} - Error sending messages to SQS:`, error);
      if (attempt === maxRetries) {
        console.error('Max retries reached. Messages not sent to SQS:', batch.map(msg => msg.Id));
        // Implement further handling, such as logging to a monitoring system
        // or saving the failed messages to a "dead-letter queue" for later analysis.
      }
    }
  }
}