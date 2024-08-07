import axios from 'axios';
import { challeges } from './challenges/index.js';

export const processMatch = async (id, collection) => {
  const match = await getMatch(id);

  console.log('Match:', id);

  // Process the match here
  const puuids = match.players.map(player => player.puuid);

  for (const puuid of puuids) {
    const challengesToAdd = await challeges(puuid, match);
    console.log('Challenges to add:', challengesToAdd);
  }

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
