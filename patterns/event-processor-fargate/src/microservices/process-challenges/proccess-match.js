import axios from 'axios';
import { challeges } from './challenges/index.js';
import { NODE_ENV, RIOT_API_KEY, RIOT_API_URL } from '../../config/envs.js';
import { updateChallenges } from './update-challenges.js';
import { client } from '../../db/mongodb.js';

export const processMatch = async (id) => {
  const match = await getMatch(id);
  console.log('Match:', id);

  const database_challenges = client.db('esports-cms');

  // Get the puuids of the players in the match
  const puuids = match.players.map((player) => player.puuid);
  const docs = await database_challenges
    .collection('challenges_users')
    .find({ userId: { $in: puuids } })
    .project({ userId: 1 })
    .toArray();
  let puuidsToProcess = docs.map((doc) => doc.userId);

  if (NODE_ENV === 'development') puuidsToProcess = puuids;

  for (const puuid of puuidsToProcess) {
    const challengesToAdd = await challeges(puuid, match);
    console.log('Challenges to add:', challengesToAdd);
    // await updateChallenges(puuid, challengesToAdd);
  }

  // Update the match in the database
  const database_sqs = client.db('sqs');
  await database_sqs.collection('matchToProcess').updateOne(
    { matchId: id },
    { $set: { processed: true } }
  );
  console.log('Match processed:', id);
};

const getMatch = async (id) => {
  const response = await axios.get(
    `${RIOT_API_URL}/val/match/console/v1/matches/${id}`,
    {
      headers: {
        'X-Riot-Token': RIOT_API_KEY,
      },
    }
  );

  if (response.status !== 200) {
    throw new Error(`Failed to fetch match ${id}`);
  }

  return response.data;
};
