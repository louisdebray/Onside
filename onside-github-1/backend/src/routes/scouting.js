import { Router } from 'express';
import { getCached, setCached } from '../cache/store.js';
import { searchPlayers, getPlayerProfile, getPlayerMarketValue, getPlayerTransfers } from '../sources/transfermarkt.js';
import { findUnderstatPlayer, getUnderstatPlayerData } from '../sources/understat.js';
import { findApiFootballPlayer, getPlayerStats, LATEST_FREE_TIER_SEASON } from '../sources/apiFootball.js';

const router = Router();

router.get('/search', async (req, res) => {
  const q = req.query.q;
  if (!q || q.trim().length < 2) return res.json([]);

  try {
    const results = await searchPlayers(q.trim());
    res.json(
      results.map((p) => ({
        id: p.id,
        name: p.name,
        position: p.position,
        club: p.club?.name || null,
        age: p.age,
        marketValue: p.marketValue ?? null,
      })),
    );
  } catch (err) {
    console.error('scouting: échec recherche joueur', err.message);
    res.status(502).json({ error: 'Recherche indisponible pour le moment' });
  }
});

router.get('/:playerId', async (req, res) => {
  const { playerId } = req.params;
  const key = `scouting:${playerId}`;
  const cached = getCached(key);
  if (cached) return res.json(cached);

  try {
    const [profile, marketValueData, transfersData] = await Promise.all([
      getPlayerProfile(playerId),
      getPlayerMarketValue(playerId).catch(() => null),
      getPlayerTransfers(playerId).catch(() => null),
    ]);

    let understat = null;
    try {
      const match = await findUnderstatPlayer(profile.name);
      if (match) {
        const data = await getUnderstatPlayerData(match.id);
        understat = {
          understatId: match.id,
          seasons: data.groups?.season || [],
          shots: data.shots || [],
        };
      }
    } catch (err) {
      console.error(`scouting: échec récupération understat pour ${profile.name}`, err.message);
    }

    const ageMatch = profile.description?.match(/,\s*(\d{1,2}),/);

    // API-Football n'est interrogé qu'à la demande (jamais en tâche de fond) pour
    // préserver le quota gratuit (100 req/jour) ; le résultat est mis en cache par
    // getPlayerStats (7 jours) et findApiFootballPlayer (30 jours).
    let advancedStats = null;
    try {
      const match = await findApiFootballPlayer(profile.name);
      if (match) {
        let season = LATEST_FREE_TIER_SEASON;
        let data = await getPlayerStats(match.id, season);
        if (!data?.response?.length) {
          season -= 1;
          data = await getPlayerStats(match.id, season);
        }
        const statsByCompetition = (data?.response?.[0]?.statistics || []).filter((s) => (s.games?.appearences || 0) > 0);
        if (statsByCompetition.length > 0) {
          advancedStats = {
            season,
            weight: match.weight || null,
            injured: match.injured ?? null,
            competitions: statsByCompetition.map((s) => ({
              competition: s.league?.name,
              team: s.team?.name,
              appearances: s.games?.appearences,
              minutes: s.games?.minutes,
              rating: s.games?.rating ? Number(s.games.rating).toFixed(1) : null,
              duelsTotal: s.duels?.total,
              duelsWon: s.duels?.won,
              dribblesAttempts: s.dribbles?.attempts,
              dribblesSuccess: s.dribbles?.success,
              tackles: s.tackles?.total,
              interceptions: s.tackles?.interceptions,
              foulsDrawn: s.fouls?.drawn,
              foulsCommitted: s.fouls?.committed,
              yellowCards: s.cards?.yellow,
              redCards: s.cards?.red,
              penaltyScored: s.penalty?.scored,
              penaltyMissed: s.penalty?.missed,
            })),
          };
        }
      }
    } catch (err) {
      console.error(`scouting: échec récupération API-Football pour ${profile.name}`, err.message);
    }

    const result = {
      profile: {
        id: profile.id,
        name: profile.name,
        imageUrl: profile.imageUrl,
        position: profile.position?.main,
        club: profile.club?.name,
        age: ageMatch ? Number(ageMatch[1]) : null,
        height: profile.height,
        foot: profile.foot,
        citizenship: profile.citizenship,
        placeOfBirth: profile.placeOfBirth,
        marketValue: profile.marketValue,
      },
      marketValueHistory: marketValueData?.marketValueHistory || [],
      transfers: transfersData?.transfers || [],
      understatAvailable: !!understat,
      seasons: understat?.seasons || [],
      shots: understat?.shots || [],
      advancedStats,
    };

    setCached(key, result, 6 * 60 * 60);
    res.json(result);
  } catch (err) {
    console.error(`scouting: échec récupération fiche joueur ${playerId}`, err.message);
    res.status(502).json({ error: 'Fiche joueur indisponible pour le moment' });
  }
});

export default router;
