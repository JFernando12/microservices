export const getPlayedMap = (match) => {
  const mapId = match.matchInfo.mapId; // "/Game/Maps/Duality/Duality"
  const lastIndex = mapId.split('/').length - 1;
  const currentMap = mapId.split('/')[lastIndex];

  return currentMap?.toLowerCase();
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

export const getPartyFriend = (puuid, match) => {
  const player = match.players.find(player => player.puuid === puuid);
  const partyId = player.partyId;

  const playersInParty = match.players.filter((player) => {
    return player.partyId === partyId && player.puuid != puuid;
  })?.length;

  return playersInParty > 0 ? 1 : 0;
}

export const getPartyTeam = (puuid, match) => {
  const player = match.players.find(player => player.puuid === puuid);

  const teamId = player.teamId;
  const partyId = player.partyId;

  const playersInParty = match.players.filter((player) => {
    return player.partyId === partyId && player.teamId === teamId;
  })?.length;

  return playersInParty >= 5 ? 1 : 0;
}

export const getKills = (puuid, match) => {
  const player = match.players.find(player => player.puuid === puuid);
  const kills = player.stats.kills;
  return kills || 0;
}

export const getUltimates = (puuid, match) => {
  const player = match.players.find(player => player.puuid === puuid);
  const ultimateCasts = player.stats.abilityCasts?.ultimateCasts;
  return ultimateCasts || 0;
}

export const getGrenades = (puuid, match) => {
  const player = match.players.find(player => player.puuid === puuid);
  const grenadeCasts = player.stats.abilityCasts?.grenadeCasts;
  return grenadeCasts || 0;
}

export const getRoundsPlayed = (puuid, match) => {
  const player = match.players.find(player => player.puuid === puuid);
  const roundsPlayed = player.stats.roundsPlayed;
  return roundsPlayed || 0;
}

export const getRoundsWon = (puuid, match) => {
  const teamId = match.players.find(player => player.puuid === puuid).teamId;
  const roundResults = match.roundResults;
  const roundsWon = roundResults.filter(round => round.winningTeam === teamId)?.length;
  return roundsWon || 0;
}

export const getRoundsAce = (puuid, match) => {
  // Paso 1
  const roundResults = match.roundResults;

  // Paso 2
  const playerStatsPerRound = roundResults.map(roundResults => roundResults.playerStats);

  // Paso 3
  const killsPerRound = playerStatsPerRound.map(round => {
    const playerStats = round.map(player => {
      return { 
        puuid: player.puuid,
        kills: player.kills.length
      }
    })
    
    const currentPlayerKills = playerStats.find(player => player.puuid === puuid);
    return currentPlayerKills;
  });

  // Paso 4
  const aces = killsPerRound.filter(stats => stats.kill === 5)?.length;
  return aces || 0;
}

export const getRoundsClutch = (puuid, match) => {
  // Paso 1
  const teamId= match.players.find(player => player.puuid === puuid).teamId;

  // Paso 2
  const roundResults = match.roundResults;

  // Paso 3
  const clutchRounds = roundResults.filter((round) => {
    return round.winningTeam === teamId && round.roundCeremony === 'CeremonyClutch';
  });

  // Paso 4
  const statsClutchRounds = clutchRounds.map(clutchRound => clutchRound.playerStats);

  // Paso 5
  const killsPerRound = statsClutchRounds.map((statsClutchRound) => {
    const killsPerPlayer = statsClutchRound.map((statsPlayer) => statsPlayer.kills);
    
    const allKills = [];
    killsPerPlayer.map((playerKills) => {
      allKills.push(...playerKills);
    })
    
    return allKills;
  });

  // Paso 6
  const puuidKillsPerRound = killsPerRound.map((roundKills) => {
    const puuids = roundKills.map(kill => kill.victim);
    return puuids;
  }); // [['abcd', 'dgfsag', ...], ['tdjuy', 'dfhsd', ...], ...]

  // Paso 7
  const clutchsCurrentPlayer = puuidKillsPerRound.filter(round => !round.includes(puuid))?.length;
  return clutchsCurrentPlayer || 0;
}

export const getRoundsFlawless = (puuid, match) => {
  const teamId = match.players.find(player => player.puuid === puuid).teamId;

  const roundResults = match.roundResults;
  const flawlessRounds = roundResults.filter((round) => {
    return round.winningTeam === teamId && round.roundCeremony === 'CeremonyFlawless';
  })?.length;

  return flawlessRounds || 0;
}

export const getSpikesPlanted = (puuid, match) => {
  const roundResults = match.roundResults;
  const roundsWithSpikePlanted = roundResults.filter(round => round.bombPlanter === puuid)?.length;
  return roundsWithSpikePlanted || 0;
}

export const getSpikesDefused = (puuid, match) => {
  const roundResults = match.roundResults;
  const roundsWithSpikeDesativated = roundResults.filter(round => round.bombDefuser === puuid)?.length;
  return roundsWithSpikeDesativated || 0;
}

export const getHeadShots = (puuid, match) => {
  // Paso 1
  const playerStats = match.roundResults.map(round => round.playerStats);

  // Paso 2
  const currentPlayerStats = playerStats.map((players) => {
    const currentStats = players.find(player => player.puuid === puuid);
    return currentStats;
  });

  // Paso 3
  const headshots = currentPlayerStats.map((player) => {
    const sumHeadshots = player.damage.reduce((a, b) => a.headshots + b.headshots, 0);
    return sumHeadshots;
  })

  // Paso 4
  const totalHeadshots = headshots.reduce((a, b) => a + b, 0);
  return totalHeadshots || 0;
}

export const getBodyShots = (puuid, match) => {
  // Paso 1
  const playerStats = match.roundResults.map(round => round.playerStats);

  // Paso 2
  const currentPlayerStats = playerStats.map((players) => {
    const currentStats = players.find(player => player.puuid === puuid);
    return currentStats;
  });

  // Paso 3
  const bodyshots= currentPlayerStats.map((player) => {
    const sumBodyshots = player.damage.reduce((a, b) => a.bodyshots + b.bodyshots, 0);
    return sumBodyshots;
  })

  // Paso 4
  const totalBodyshots = bodyshots.reduce((a, b) => a + b, 0);
  return totalBodyshots || 0;
}

export const getLegsShots = (puuid, match) => {
  // Paso 1
  const playerStats = match.roundResults.map(round => round.playerStats);

  // Paso 2
  const currentPlayerStats = playerStats.map((players) => {
    const currentStats = players.find(player => player.puuid === puuid);
    return currentStats;
  });

  // Paso 3
  const legshots = currentPlayerStats.map((player) => {
    const sumLegshots = player.damage.reduce((a, b) => a.legshots + b.legshots, 0);
    return sumLegshots;
  })

  // Paso 4
  const totalLegshots = legshots.reduce((a, b) => a + b, 0);
  return totalLegshots || 0;
}

export const getDamage = (puuid, match) => {
  // Paso 1
  const playerStats = match.roundResults.map(round => round.playerStats);

  // Paso 2
  const currentPlayerStats = playerStats.map((players) => {
    const currentStats = players.find(player => player.puuid === puuid);
    return currentStats;
  });

  // Paso 3
  const damages = currentPlayerStats.map((player) => {
    const damage = player.damage.reduce((a, b) => a.damage + b.damage, 0);
    return damage;
  })

  // Paso 4
  const totalDamage = damages.reduce((a, b) => a + b, 0);
  return totalDamage || 0;
}