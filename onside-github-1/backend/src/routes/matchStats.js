import { Router } from 'express';
import { getMatchStatistics } from '../sources/apiFootball.js';
import { searchClubs, getClubPlayers } from '../sources/transfermarkt.js';
import { findUnderstatPlayer, findUnderstatMatchByPlayer, getUnderstatMatchInfo, sameTeam } from '../sources/understat.js';
import { getCached, setCached } from '../cache/store.js';

const router = Router();

function toGenericShape(info, homeTeamName) {
  const homeIsA = !sameTeam(info.team_h, homeTeamName);
  const h = homeIsA ? 'a' : 'h';
  const a = homeIsA ? 'h' : 'a';
  return {
    available: true,
    teams: [
      {
        team: info[`team_${h}`],
        stats: [
          { type: 'Tirs', value: info[`${h}_shot`] },
          { type: 'Tirs cadrés', value: info[`${h}_shotOnTarget`] },
          { type: 'xG', value: Number(info[`${h}_xg`]).toFixed(2) },
          { type: 'Actions dangereuses', value: info[`${h}_deep`] },
          { type: 'PPDA (pressing)', value: Number(info[`${h}_ppda`]).toFixed(1) },
        ],
      },
      {
        team: info[`team_${a}`],
        stats: [
          { type: 'Tirs', value: info[`${a}_shot`] },
          { type: 'Tirs cadrés', value: info[`${a}_shotOnTarget`] },
          { type: 'xG', value: Number(info[`${a}_xg`]).toFixed(2) },
          { type: 'Actions dangereuses', value: info[`${a}_deep`] },
          { type: 'PPDA (pressing)', value: Number(info[`${a}_ppda`]).toFixed(1) },
        ],
      },
    ],
  };
}

async function resolveClub(teamName) {
  const attempts = [
    teamName,
    teamName.replace(/\s+\d{4}$/, ''),
    teamName.replace(/^(FC|AFC|CF|AC)\s+|\s+(FC|AFC|CF|AC)$/gi, '').trim(),
  ];
  for (const attempt of [...new Set(attempts)]) {
    const clubResults = await searchClubs(attempt);
    const club = clubResults.find((c) => c.country) || clubResults[0];
    if (club) return club;
  }
  return null;
}

async function tryClubSquad(teamName, homeTeamName, awayTeamName, utcDate) {
  const club = await resolveClub(teamName);
  if (!club) return null;

  const { players = [] } = await getClubPlayers(club.id);
  for (const player of players.slice(0, 15)) {
    try {
      const understatPlayer = await findUnderstatPlayer(player.name);
      if (!understatPlayer) continue;
      const matchId = await findUnderstatMatchByPlayer(understatPlayer.id, homeTeamName, awayTeamName, utcDate);
      if (!matchId) continue;
      const info = await getUnderstatMatchInfo(matchId);
      if (info) return toGenericShape(info, homeTeamName);
    } catch {
      continue;
    }
  }
  return null;
}

async function tryUnderstatViaClubRoster(homeTeamName, awayTeamName, utcDate) {
  const viaHome = await tryClubSquad(homeTeamName, homeTeamName, awayTeamName, utcDate);
  if (viaHome) return viaHome;
  return tryClubSquad(awayTeamName, homeTeamName, awayTeamName, utcDate);
}

router.get('/:matchId', async (req, res) => {
  const { matchId } = req.params;
  const { home, away, date } = req.query;

  if (!home || !away || !date) {
    return res.status(400).json({ error: 'home, away et date requis' });
  }

  const key = `match-stats:${matchId}`;
  const cached = getCached(key);
  if (cached) return res.json(cached);

  try {
    const apiFootballResult = await getMatchStatistics(matchId, home, away, date);
    if (apiFootballResult.available) {
      setCached(key, apiFootballResult, 0);
      return res.json(apiFootballResult);
    }

    const understatResult = await tryUnderstatViaClubRoster(home, away, date);
    const result = understatResult || { available: false };
    setCached(key, result, understatResult ? 0 : 24 * 60 * 60);
    res.json(result);
  } catch (err) {
    console.error('match-stats: échec récupération statistiques', err.message);
    res.status(502).json({ error: 'Statistiques de match indisponibles' });
  }
});

export default router;
