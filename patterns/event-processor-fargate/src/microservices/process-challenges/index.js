import { processMatch } from './proccess-match.js';
import { NODE_ENV } from '../../config/envs.js';
import { client } from '../../db/mongodb.js';

export const processChallenges = async (data) => {
  const ids = data; // [id1, id2, id3, ...]

  const database_sqs = client.db('sqs');

  const docs = await database_sqs
    .collection('matchToProcess')
    .find({ matchId: { $in: ids }, processed: false, needToProcess: true })
    .project({ matchId: 1 })
    .toArray();
  let idsToProcess = docs.map((doc) => doc.matchId);

  if (NODE_ENV === 'development') idsToProcess = ids;

  const promises = idsToProcess.map((id) => processMatch(id));

  await Promise.all(promises);
};
