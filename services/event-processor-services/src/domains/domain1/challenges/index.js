const getPlayedMap = (match) => {
  const mapId = match.matchInfo.mapId; // "/Game/Maps/Duality/Duality"
  const currentMap = mapId.split('/')[lastIndex];

  return currentMap;
};

const getWinMap = (puuid, match) => {
  const teamId = match.players.find((player) => player.puuid === puuid).teamId; // "Blue"
  const won = match.teams.find((team) => team.teamId === teamId).won;

  return won;
};

const getPlayedAgent = async (puuid, match) => {
  const characterId = match.players.find(player => player.puuid === puuid).characterId;

  const characters = [
    { id: '5f8d3a7f-467b-97f3-062c-13ccf203c006', name: 'Brimstone' },
    { id: 'f94c3b30-42be-e959-889c-5aa313dba261', name: 'Viper' },
  ];
  const character = characters.find(character => character.id === characterId)?.name;

  const delay = new Promise((resolve) => setTimeout(resolve, 1000));
  await delay;

  return character;
}

const getPlayedTime = (match) => {
  const milisegundos = match.matchInfo.gameLengthMillis;
  const minutos = milisegundos / 60000;

  return minutos;
}

const getKills = (puuid, match) => {
  const player = match.players.find(player => player.puuid === puuid);
  const kills = player.stats.kills;
  return kills;
}

const getUltimates = (puuid, match) => {
  const player = match.players.find(player => player.puuid === puuid);
  const ultimateCasts = player.stats.abilityCasts.ultimateCasts;
  return ultimateCasts;
}

const challeges = async (puuid, match) => {
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
