import axios from 'axios';
import { MongoClient } from 'mongodb';

export const processEventDomain1 = async (data) => {
  const ids = data;

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

const processMatch = async (id, collection) => {
  const match = await getMatch(id);

  console.log('Match:', id);

  // Process the match here
  const puuids = match.players.map(player => player.puuid);

  

  // Update the match in the database
  await collection.updateOne({ matchId: id }, { $set: { processed: true } });
  console.log('Match processed:', id);
}

const getMatch = async (id) => {
  const RIOT_API_URL = process.env.RIOT_API_URL;
  const RIOT_API_KEY = process.env.RIOT_API_KEY;
  
  const response = await axios.get(`${RIOT_API_URL}/val/match/console/v1/matches/${id}`, {
    headers: {
      'X-Riot-Token': RIOT_API_KEY,
    },
  });

  if (response.status !== 200) {
    throw new Error(`Failed to fetch match ${id}`);
  }

  return response.data;
}
