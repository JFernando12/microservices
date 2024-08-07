import { MongoClient } from 'mongodb';
import { processMatch } from './proccess-match.js';

export const processChallenges = async (data) => {
  const ids = data; // [id1, id2, id3, ...]

  const MONGO_URI = process.env.MONGO_URI;
  const client = new MongoClient(MONGO_URI,  {});
  await client.connect();
  const database = client.db('test');
  const collection = database.collection('matchToProcess');

  // Find all the ids that have isProcessed = false and needToProcess = true
  const docs = await collection.find({ matchId: { $in: ids }, processed: false, needToProcess: true }).project({ matchId: 1 }).toArray();
  const idsToProcess = docs.map(doc => doc.matchId);
  
  const promises = idsToProcess.map(id => processMatch(id, collection));

  await Promise.all(promises);

  await client.close();
}