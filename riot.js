const API_KEY = process.env.RIOT_API_KEY || 'RGAPI-a5702897-2a00-4cb4-9046-c1f0ecd89de9';

async function fetchRiot(url) {
  const res = await fetch(`${url}${url.includes('?') ? '&' : '?'}api_key=${API_KEY}`);
  if (!res.ok) {
    const err = await res.text();
    throw { status: res.status, message: err };
  }
  return res.json();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { name, tag } = req.query;
  if (!name || !tag) return res.status(400).json({ error: 'Missing name or tag' });

  try {
    const account = await fetchRiot(
      `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`
    );
    const summoner = await fetchRiot(
      `https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${account.puuid}`
    );
    const ranked = await fetchRiot(
      `https://euw1.api.riotgames.com/lol/league/v4/entries/by-summoner/${summoner.id}`
    );
    const solo = ranked.find(e => e.queueType === 'RANKED_SOLO_5x5') || null;

    return res.status(200).json({
      name,
      tag,
      profileIconId: summoner.profileIconId,
      summonerLevel: summoner.summonerLevel,
      solo,
    });
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message || 'Unknown error' });
  }
}
