import { getPlayedMap, getWinMap, getPlayedAgent, getPlayedTime, getKills, getUltimates } from './match-processors.js';

export const challeges = async (puuid, match) => {
  const matchId = match.matchInfo.matchId;

  const playedMap = getPlayedMap(match);
  const win = getWinMap(puuid, match);
  const playedAgent = await getPlayedAgent(puuid, match);
  const playedTime = getPlayedTime(match);
  const kills = getKills(puuid, match);
  const ultimates = getUltimates(puuid, match);

  const challengesData = {
    playedMap: {
      [playedMap]: { quantity: 1 },
    },
    winMap: {
      [playedMap]: { quantity: win ? 1 : 0 },
    },
    playedAgent: {
      [playedAgent]: { quantity: 1 },
    },
    winAgent: {
      [playedAgent]: { quantity: win ? 1 : 0 },
    },
    winTime: {
      30: { quantity: win && playedTime < 30 ? 1 : 0 },
      45: { quantity: win && playedTime < 45 ? 1 : 0 },
    },
    stats: {
      kills: { quantity: kills },
      ultimates: { quantity: ultimates },
    }
  };

  // Convert to the desired format and filter in one step using flatMap
  const challengesToAdd = Object.entries(challengesData)
    .flatMap(([type, targets]) => 
      Object.entries(targets).map(([target, { quantity }]) => ({
        puuid,
        matchId,
        type,
        target,
        quantity
      }))
    )
    .filter(challenge => challenge.quantity > 0);

  console.log('Challenges to add:', challengesToAdd);

  return challengesToAdd;
};
