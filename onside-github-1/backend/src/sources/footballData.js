import axios from 'axios';
import { getCached, setCached } from '../cache/store.js';

const BASE_URL = 'https://api.football-data.org/v4';
const MIN_INTERVAL_MS = 6000;

let lastCallAt = 0;
let queue = Promise.resolve();

function throttledGet(url) {
  const run = async () => {
    const wait = MIN_INTERVAL_MS - (Date.now() - lastCallAt);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastCallAt = Date.now();
    const token = process.env.FOOTBALL_DATA_TOKEN;
    if (!token) throw new Error('FOOTBALL_DATA_TOKEN manquant');
    const res = await axios.get(`${BASE_URL}${url}`, {
      headers: { 'X-Auth-Token': token },
    });
    return res.data;
  };
  const result = queue.then(run, run);
  queue = result.catch(() => {});
  return result;
}

export async function getStandings(competitionCode, season) {
  const query = season ? `?season=${season}` : '';
  return throttledGet(`/competitions/${competitionCode}/standings${query}`);
}

export async function getMatches(competitionCode, season) {
  const query = season ? `?season=${season}` : '';
  return throttledGet(`/competitions/${competitionCode}/matches${query}`);
}

export async function getScorers(competitionCode) {
  return throttledGet(`/competitions/${competitionCode}/scorers`);
}

export async function getTeam(teamId) {
  return throttledGet(`/teams/${teamId}`);
}

function getCachedVenueOnly(teamId) {
  const cached = getCached(`team-venue:${teamId}`);
  return cached ? cached.venue : null;
}

// Fast path for user-facing requests: attaches venues already in cache, never calls the external API.
export async function getUpcomingFixtures(competitionCode, season) {
  const data = await getMatches(competitionCode, season);
  const matches = (data.matches || []).filter((m) => m.status === 'SCHEDULED' || m.status === 'TIMED');
  return {
    ...data,
    matches: matches.map((m) => ({ ...m, venue: getCachedVenueOnly(m.homeTeam?.id) })),
  };
}

// Slow path, only ever called from the background scheduler: fetches + caches venues one team at a time.
export async function warmUpVenuesCache(matches) {
  const homeTeamIds = [...new Set(matches.map((m) => m.homeTeam?.id).filter(Boolean))];
  for (const teamId of homeTeamIds) {
    if (getCached(`team-venue:${teamId}`) !== null) continue;
    try {
      await getTeamVenue(teamId);
    } catch (err) {
      console.error(`fixtures: échec récupération stade équipe ${teamId}`, err.message);
    }
  }
}

export async function getTeamVenue(teamId) {
  const key = `team-venue:${teamId}`;
  const cached = getCached(key);
  if (cached !== null) return cached.venue;
  const team = await getTeam(teamId);
  const venue = team.venue || null;
  setCached(key, { venue }, 30 * 24 * 60 * 60);
  return venue;
}
