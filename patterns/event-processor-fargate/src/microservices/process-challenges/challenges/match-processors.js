export const getPlayedMap = (match) => {
  const mapId = match.matchInfo.mapId; // "/Game/Maps/Duality/Duality"
  const lastIndex = mapId.split('/').length - 1;
  const currentMap = mapId.split('/')[lastIndex];

  return currentMap;
};

export const getWinMap = (puuid, match) => {
  const teamId = match.players.find((player) => player.puuid === puuid).teamId; // "Blue"
  const won = match.teams.find((team) => team.teamId === teamId).won;

  return won;
};

export const getPlayedAgent = async (puuid, match) => {
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

export const getPlayedTime = (match) => {
  const milisegundos = match.matchInfo.gameLengthMillis;
  const minutos = milisegundos / 60000;

  return minutos;
}

export const getKills = (puuid, match) => {
  const player = match.players.find(player => player.puuid === puuid);
  const kills = player.stats.kills;
  return kills;
}

export const getUltimates = (puuid, match) => {
  const player = match.players.find(player => player.puuid === puuid);
  const ultimateCasts = player.stats.abilityCasts.ultimateCasts;
  return ultimateCasts;
}