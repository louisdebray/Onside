import axios from 'axios';
import db from '../config/db.js';
import { getCached, setCached } from '../cache/store.js';

const BASE_URL = 'https://v3.football.api-sports.io';
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

function apiHeaders() {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) throw new Error('API_FOOTBALL_KEY manquant');
  return { 'x-apisports-key': key };
}

function normalizeTeamName(name) {
  return (name || '')
    .toLowerCase()
    .replace(/\bfc\b|\bcf\b|\bafc\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function teamsMatch(apiName, footballDataName) {
  const a = normalizeTeamName(apiName);
  const b = normalizeTeamName(footballDataName);
  return a && b && (a.includes(b) || b.includes(a));
}

const DIACRITICS_RE = new RegExp('[̀-ͯ]', 'g');

function normalizeName(name) {
  return (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS_RE, '')
    .replace(/[^a-z0-9 ]/g, '')
    .trim();
}

// Le tier gratuit d'API-Football a un quota serré (100 req/jour) : on met en cache
// la résolution nom -> identifiant très longtemps (30 jours) pour ne jamais refaire
// une recherche pour un joueur déjà vu.
export async function findApiFootballPlayer(playerName) {
  const cacheKey = `apifootball:player-search:${normalizeName(playerName)}`;
  const cached = getCached(cacheKey);
  if (cached !== null) return cached;

  const target = normalizeName(playerName);
  const lastName = target.split(' ').slice(-1)[0];
  let match = null;
  try {
    const res = await axios.get(`${BASE_URL}/players/profiles`, {
      params: { search: lastName },
      headers: apiHeaders(),
    });
    const candidates = (res.data?.response || []).map((r) => r.player);
    match =
      candidates.find((c) => normalizeName(c.name) === target) ||
      candidates.find((c) => normalizeName(c.name).includes(target.split(' ')[0])) ||
      null;
  } catch (err) {
    console.error(`apiFootball: échec recherche joueur "${playerName}"`, err.message);
  }

  setCached(cacheKey, match, 30 * 24 * 60 * 60);
  return match;
}

// Le tier gratuit d'API-Football ne donne accès qu'aux saisons 2022 à 2024 (pas la
// saison en cours) : on prend donc la plus récente disponible, en le signalant
// clairement côté frontend plutôt que de faire croire à une stat "à jour".
export const LATEST_FREE_TIER_SEASON = 2024;

export async function getPlayerStats(playerId, season) {
  const cached = db
    .prepare('SELECT data_json, updated_at FROM player_stats WHERE player_id = ? AND season = ? AND competition = ?')
    .get(playerId, season, '');

  if (cached && Date.now() - cached.updated_at < TTL_MS) {
    return JSON.parse(cached.data_json);
  }

  const key = process.env.API_FOOTBALL_KEY;
  if (!key) throw new Error('API_FOOTBALL_KEY manquant');

  const res = await axios.get(`${BASE_URL}/players`, {
    params: { id: playerId, season },
    headers: { 'x-apisports-key': key },
  });
  const data = res.data;

  db.prepare(
    `INSERT INTO player_stats (player_id, season, competition, data_json, updated_at) VALUES (?, ?, '', ?, ?)
     ON CONFLICT(player_id, season, competition) DO UPDATE SET data_json = excluded.data_json, updated_at = excluded.updated_at`
  ).run(playerId, season, JSON.stringify(data), Date.now());

  return data;
}

async function findFixtureId(homeTeamName, awayTeamName, utcDate) {
  const date = utcDate?.slice(0, 10);
  if (!date) return null;
  const res = await axios.get(`${BASE_URL}/fixtures`, { params: { date }, headers: apiHeaders() });
  const fixtures = res.data?.response || [];
  const match = fixtures.find(
    (f) => teamsMatch(f.teams?.home?.name, homeTeamName) && teamsMatch(f.teams?.away?.name, awayTeamName),
  );
  return match?.fixture?.id || null;
}

export async function getMatchStatistics(matchId, homeTeamName, awayTeamName, utcDate) {
  const cacheKey = `match-stats:${matchId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const fixtureId = await findFixtureId(homeTeamName, awayTeamName, utcDate);
  if (!fixtureId) {
    const result = { available: false };
    setCached(cacheKey, result, 24 * 60 * 60);
    return result;
  }

  const res = await axios.get(`${BASE_URL}/fixtures/statistics`, {
    params: { fixture: fixtureId },
    headers: apiHeaders(),
  });
  const response = res.data?.response || [];
  if (response.length === 0) {
    const result = { available: false };
    setCached(cacheKey, result, 24 * 60 * 60);
    return result;
  }

  const result = {
    available: true,
    teams: response.map((entry) => ({
      team: entry.team?.name,
      stats: (entry.statistics || []).map((s) => ({ type: s.type, value: s.value })),
    })),
  };
  setCached(cacheKey, result, 0);
  return result;
}
