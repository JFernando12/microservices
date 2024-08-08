import { client } from '../../db/mongodb';

export const updateChallenges = async (puuid, challenges) => {
  // Get existing challenges, user.challenges, is an array of objects
  const database_challenges = client.db('esports-cms');
  const user = await database_challenges
    .collection('challenges_users')
    .findOne({ userId: puuid }, { projection: { challenges: 1 } });
  const existingChallenges = user?.challenges;

  // { challengeId: string, progress: number, slug: string }[], sum the progress of the challenges
  const newChallenges = existingChallenges.map((existingChallenge) => {
    const challenge = challenges.find(
      (challenge) => challenge.slug === existingChallenge.slug
    );

    if (!challenge) {
      return existingChallenge;
    }

    return {
      ...existingChallenge,
      progress: existingChallenge.progress + challenge.quantity,
    };
  });

  await database_challenges
    .collection('challenges_users')
    .updateOne({ userId: puuid }, { $set: { challenges: newChallenges } });
};
