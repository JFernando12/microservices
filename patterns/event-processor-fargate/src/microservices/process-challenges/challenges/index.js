import {
  getPlayedMap,
  getWinMap,
  getPlayedAgent,
  getPlayedTime,
  getKills,
  getUltimates,
  getGrenades,
  getRoundsPlayed,
  getRoundsWon,
  getRoundsAce,
  getRoundsClutch,
  getRoundsFlawless,
  getSpikesPlanted,
  getSpikesDefused,
  getHeadShots,
  getBodyShots,
  getLegsShots,
  getDamage,
  getPartyFriend,
  getPartyTeam,
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

  // Party
  const partyFriend = getPartyFriend(puuid, match);
  const partyTeam = getPartyTeam(puuid, match);

  // Stats
  const kills = getKills(puuid, match);
  const ultimates = getUltimates(puuid, match);
  const grenades = getGrenades(puuid, match);
  const roundsPlayed = getRoundsPlayed(puuid, match);
  const roundsWon = getRoundsWon(puuid, match);
  const roundsAce = getRoundsAce(puuid, match);
  const roundsClutch = getRoundsClutch(puuid, match);
  const roundsFlawless = getRoundsFlawless(puuid, match);
  const spikesPlanted = getSpikesPlanted(puuid, match);
  const spikesDefused = getSpikesDefused(puuid, match);
  const headShots = getHeadShots(puuid, match);
  const bodyShots = getBodyShots(puuid, match);
  const legsShots = getLegsShots(puuid, match);
  const damage = getDamage(puuid, match);

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
      time: {
        30: {
          win: { quantity: win && playedTime < 30 ? 1 : 0 },
        },
        45: {
          win: { quantity: win && playedTime < 45 ? 1 : 0 },
        },
      },
      party: {
        friend: {
          played: { quantity: partyFriend },
          win: { quantity: win && partyFriend ? 1 : 0 },
        },
        team: {
          played: { quantity: partyTeam },
          win: { quantity: win && partyTeam ? 1 : 0 },
        }
      },
      stats: {
        kills: {
          x: { quantity: kills },
        },
        ultimates: {
          x: { quantity: ultimates },
        },
        grenades: {
          x: { quantity: grenades },
        },
        rounds: {
          played: { quantity: roundsPlayed },
          win: { quantity: roundsWon },
          ace: { quantity: roundsAce },
          clutch: { quantity: roundsClutch },
          flawless: { quantity: roundsFlawless }
        },
        spikes: {
          planted: { quantity: spikesPlanted },
          defused: { quantity: spikesDefused },
        },
        shots: {
          head: { quantity: headShots },
          body: { quantity: bodyShots },
          legs: { quantity: legsShots },
        },
        damage: {
          x: { quantity: damage },
        }
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
