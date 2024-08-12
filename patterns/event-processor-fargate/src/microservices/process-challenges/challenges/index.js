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
  console.log('Match::', matchId);

  const playedMap = getPlayedMap(match);
  const win = getWinMap(puuid, match);
  const playedAgent = await getPlayedAgent(puuid, match);
  const playedTime = getPlayedTime(match);
  const kills = getKills(puuid, match);
  const ultimates = getUltimates(puuid, match);

  // Game - type - target - objective
  // const challengesData = {
  //   playedAgent: {
  //     [playedAgent]: { quantity: 1 },
  //   },
  //   winAgent: {
  //     [playedAgent]: { quantity: win ? 1 : 0 },
  //   },
  //   stats: {
  //     kills: { quantity: kills },
  //     ultimates: { quantity: ultimates },
  //     winTime45: { quantity: win && playedTime < 45 ? 1 : 0 }
  //   },
  // };
  const challengesData = {
    valorant: {
      map: {
        [playedMap]: {
          played: { quantity: 1 },
          win: { quantity: win ? 1 : 0 },
        }
      },
      agent: {
        [playedAgent]: {
          played: { quantity: 1 },
          win: { quantity: win ? 1 : 0 },
        }
      },
      stats: {
        kills: {
          na: { quantity: kills },
        },
        ultimates: {
          na: { quantity: ultimates },
        },
        winTime45: {
          na: { quantity: win && playedTime < 45 ? 1 : 0 }
        }
      }
    }
  }

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
        }))
    )
    .filter((challenge) => challenge.quantity > 0);

  console.log('Challenges to add:', challengesToAdd);

  return challengesToAdd;
};
