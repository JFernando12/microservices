import {
  getPlayedMap,
  getWinMap,
  getPlayedAgent,
  getPlayedTime,
  getKills,
  getUltimates,
} from './match-processors.js';

export const challeges = async (puuid, match) => {
  const matchId = match.matchInfo.matchId;

  const challengesIds = {
    'playedMap-abyss': 'd1b3b3b3-4b1b-4f3b-8b3b-3b3b3b3b3b3b',
    'playedMap-ascend': 'd1b3b3b3-4b1b-4f3b-8b3b-3b3b3b3b3b3c',
    'playedMap-bind': 'd1b3b3b3-4b1b-4f3b-8b3b-3b3b3b3b3b3d',
    'playedMap-haven': 'd1b3b3b3-4b1b-4f3b-8b3b-3b3b3b3b3b3e',
    'playedMap-sunset': 'd1b3b3b3-4b1b-4f3b-8b3b-3b3b3b3b3b3f',
    'winMap-abyss': 'd1b3b3b3-4b1b-4f3b-8b3b-3b3b3b3b3b4',
    'winMap-ascend': 'd1b3b3b3-4b1b-4f3b-8b3b-3b3b3b3b3b5',
    'winMap-bind': 'd1b3b3b3-4b1b-4f3b-8b3b-3b3b3b3b3b6',
    'winMap-haven': 'd1b3b3b3-4b1b-4f3b-8b3b-3b3b3b3b3b7',
    'winMap-sunset': 'd1b3b3b3-4b1b-4f3b-8b3b-3b3b3b3b3b8',
    'playedAgent-brimstone': 'd1b3b3b3-4b1b-4f3b-8b3b-3b3b3b3b3b9',
    'playedAgent-viper': 'd1b3b3b3-4b1b-4f3b-8b3b-3b3b3b3b3ba',
    'playedAgent-omen': 'd1b3b3b3-4b1b-4f3b-8b3b-3b3b3b3b3bb',
    'winAgent-brimstone': 'd1b3b3b3-4b1b-4f3b-8b3b-3b3b3b3b3bc',
    'winAgent-viper': 'd1b3b3b3-4b1b-4f3b-8b3b-3b3b3b3b3bd',
    'winAgent-omen': 'd1b3b3b3-4b1b-4f3b-8b3b-3b3b3b3b3be',
    'winTime-30': 'd1b3b3b3-4b1b-4f3b-8b3b-3b3b3b3b3bf',
    'winTime-45': 'd1b3b3b3-4b1b-4f3b-8b3b-3b3b3b3b3c0',
    'stats-kills': 'd1b3b3b3-4b1b-4f3b-8b3b-3b3b3b3b3c1',
    'stats-ultimates': 'd1b3b3b3-4b1b-4f3b-8b3b-3b3b3b3b3c2',
  };

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
    },
  };

  // Convert to the desired format and filter in one step using flatMap
  const challengesToAdd = Object.entries(challengesData)
    .flatMap(([type, targets]) =>
      Object.entries(targets)
        .filter(([target]) => target != 'undefined')
        .map(([target, { quantity }]) => ({
          puuid,
          matchId,
          type,
          target,
          quantity,
          id: challengesIds[`${type}-${target}`],
          slug: `${type}-${target}`,
        }))
    )
    .filter((challenge) => challenge.quantity > 0);

  console.log('Challenges to add:', challengesToAdd);

  return challengesToAdd;
};
