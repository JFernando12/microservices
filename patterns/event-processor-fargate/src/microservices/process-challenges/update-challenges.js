import { client } from '../../db/mongodb.js';

export const updateChallenges = async (puuid, challenges) => {
  // Get existing challenges, user.challenges, is an array of objects
  const database_challenges = client.db('esports-cms');
  const user = await database_challenges
    .collection('challenges_users')
    .findOne({ userId: puuid }, { projection: { challenges: 1 } });

  // { challengeId: string, progress: number }[]
  const existingChallenges = user?.challenges;
  const challengesIds = challenges.map((c) => c._id);

  // { _id: string, type: string, target: string }[]
  const challegeItems = database_challenges
    .collection('challenges_items')
    .find({ _id: { $in: challengesIds } })
    .project({ _id: 1, type: 1, target: 1 })
    .toArray();

  // challenges: { type: string, target: string, quantity: number }[],
  // Update the challenges, sum the quantity to the progress
  const challengesWithId = challenges.map((c) => {
    const challengeItem = challegeItems.find((ct) => {
      return ct.type === c.type && ct.target === c.target
    });

    if (!challengeItem) return null;
    
    return {
      ...c,
      id: challengeItem._id,
    };
  }).filter((c) => c);
  console.log('Challenges updated:', challengesUpdated);

  // Update the user challenges
  const challengesUpdated = existingChallenges.map((ec) => {
    const challenge = challengesWithId.find((c) => c.id === ec.challengeId);
    if (!challenge) return ec;
    return {
      ...ec,
      progress: ec.progress + challenge.quantity,
    };
  });

  await database_challenges
    .collection('challenges_users')
    .updateOne(
      { userId: puuid },
      { $set: { challenges: challengesUpdated } }
    );
};
