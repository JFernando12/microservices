import {
  getPlayedMap,
  getWinMap,
  getPlayedAgent,
  getPlayedTime,
  getKills,
  getUltimates,
} from './match-processors.js';

const formatValue = (value) => {
  if (value === 'undefined') return undefined;
  if (value === 'x') return null;
  if (typeof value === 'number' && value === 0) return undefined;
  if (typeof 'string' && value === '') return undefined;
  if (typeof value === 'string') return value.toLowerCase();

  return value;
};

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
  const challengesData = {
    valorant: {
      map: {
        [playedMap]: {
          played: { quantity: 1 },
          win: { quantity: win ? 1 : 0 },
        },
      },
      agent: {
        [playedAgent]: {
          played: { quantity: 1 },
          win: { quantity: win ? 1 : 0 },
        },
      },
      stats: {
        kills: {
          x: { quantity: kills },
        },
        ultimates: {
          x: { quantity: ultimates },
        },
        winTime45: {
          x: { quantity: win && playedTime < 45 ? 1 : 0 },
        },
      },
    },
  };

  const challengesConvertion = [];
  Object.entries(challengesData).forEach(([game, types]) => {
    Object.entries(types).forEach(([type, targets]) => {
      Object.entries(targets).forEach(([target, objectives]) => {
        Object.entries(objectives).forEach(([objective, data]) => {
          challengesConvertion.push({
            matchId: matchId,
            puuid: puuid,
            game: formatValue(game),
            type: formatValue(type),
            target: formatValue(target),
            objective: formatValue(objective),
            quantity: formatValue(data.quantity),
          });
        });
      });
    });
  });

  const response =challengesConvertion.filter((c) =>
    !Object.values(c).some(value => value === undefined)
  );

  console.log('Challenges to add:', response);

  return response;
};
