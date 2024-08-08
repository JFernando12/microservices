import { MongoClient } from 'mongodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import axios from 'axios';

console.log('Starting Domain 5 cron job...');
console.log('Processing IDs...');

const NODE_ENV = process.env.NODE_ENV;
const QUEUE_URL = process.env.QUEUE_URL;
const MONGO_URI = process.env.MONGO_URI;
const RIOT_API_KEY = process.env.RIOT_API_KEY
const RIOT_API_URL = process.env.RIOT_API_URL;

export const handler = async () => {
  const client = new MongoClient(MONGO_URI,  {});

  // AWS SQS setup
  const sqsClient = new SQSClient({ region: 'us-east-1' });

  try {
    // Connect to MongoDB
    await client.connect();
    const database = client.db('test');
    const collection = database.collection('matchToProcess');

    // Get IDs to process
    let ids = await getIdsToProcess();

    if (NODE_ENV === 'development') ids = ['1', '2', '3']; // For local testing
    console.log('IDs to process:', ids);

    // Step 1: Find non-existing IDs
    const existingDocs = await collection.find({ matchId: { $in: ids } }).project({ matchId: 1 }).toArray();
    const existingIds = existingDocs.map(doc => doc.matchId);
    const nonExistingIds = ids.filter(id => !existingIds.includes(id));

    if (nonExistingIds.length === 0) {
      console.log('All IDs already exist in the database.');
      return;
    }
    
    // Step 2: Insert new IDs into MongoDB
    const newDocs = nonExistingIds.map(id => ({ matchId: id, processed: false, needToProcess: true }));
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

const sendIdsInBatchesToSqs = async (sqsClient, queueUrl, ids) =>{
  const maxBatchSize = 10; // SQS maximum batch size
  const maxMessageSize = 256 * 1024; // SQS maximum message size in bytes
  let batch = [];

  for (const id of ids) {
    const messageBody = JSON.stringify({ id });
    
    // Check if adding this message would exceed the batch size or message size
    if (batch.length >= maxBatchSize || (batch.length > 0 && Buffer.byteLength(messageBody) + Buffer.byteLength(batch.join('')) > maxMessageSize)) {
      // Send the current batch
      await sendBatchToSqs(sqsClient, queueUrl, batch);
      batch = [];
    }

    batch.push(id);
  }

  // Send any remaining messages
  if (batch.length > 0) {
    await sendBatchToSqs(sqsClient, queueUrl, batch);
  }
}

const sendBatchToSqs = async (sqsClient, queueUrl, batch) => {
  const params = {
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(batch),
  };

  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const command = new SendMessageCommand(params);
      const result = await sqsClient.send(command);
      if (result.Failed?.length > 0) {
        throw new Error('Failed to send some messages to SQS');
      }
      console.log('Sent messages to AWS SQS:', batch);
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

const getIdsToProcess = async () => {
  const queueMatchIdsUrl = `${RIOT_API_URL}/val/match/console/v1/recent-matches/by-queue/console_unrated`;
  const response = await axios.get(queueMatchIdsUrl, {
    headers: {
      'X-Riot-Token': RIOT_API_KEY,
    },
  });

  if (response.status !== 200) {
    throw new Error('Failed to fetch IDs to process');
  }

  return response.data.matchIds;
}