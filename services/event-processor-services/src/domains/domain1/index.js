export const processEventDomain1 = async (data) => {
  const ids = data;

  const promises = ids.map(id => processMatch(id));

  await Promise.all(promises);
}

const processMatch = async (id) => {
  const match = await getMatch(id);

  console.log('Match:', match);
}

const getMatch = async (id) => {
  const RIOT_API_URL = process.env.RIOT_API_URL;
  const RIOT_API_KEY = process.env.RIOT_API_KEY;
  console.log('riot_api_url:', RIOT_API_URL);
  console.log('riot_api_key:', RIOT_API_KEY);
  
  const response = await axios.get(`${RIOT_API_URL}/val/match/console/v1/matches/${id}`, {
    headers: {
      'X-Riot-Token': RIOT_API_KEY,
    },
  });

  if (response.status !== 200) {
    throw new Error(`Failed to fetch match ${id}`);
  }

  return response.data;
}
