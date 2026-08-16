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
//
// De nombreux joueurs partagent un seul nom/surnom (ex: plusieurs "Vitinha" dans le
// foot pro, dont un défenseur portugais retraité de 40 ans sans rapport avec celui du
// PSG) : un simple match par nom exact prenait arbitrairement le premier résultat de
// l'API, qui n'était pas forcément le bon joueur. On utilise donc l'âge connu (déjà
// récupéré via Transfermarkt) pour départager les homonymes, et on l'inclut dans la
// clé de cache pour ne jamais réutiliser la résolution d'un homonyme par erreur.
export async function findApiFootballPlayer(playerName, expectedAge, expectedNationalities) {
  const nationalityKey = (expectedNationalities || []).map(normalizeName).sort().join(',') || 'na';
  const cacheKey = `apifootball:player-search:${normalizeName(playerName)}:${expectedAge ?? 'na'}:${nationalityKey}`;
  const cached = getCached(cacheKey);
  if (cached !== null) return cached;

  const target = normalizeName(playerName);
  const targetWords = target.split(' ');
  const lastName = targetWords[targetWords.length - 1];
  const isMononym = targetWords.length === 1;
  const targetFirstInitial = targetWords[0]?.[0];
  let match = null;
  let fetchFailed = false;
  try {
    const res = await axios.get(`${BASE_URL}/players/profiles`, {
      params: { search: lastName },
      headers: apiHeaders(),
    });
    // Un quota dépassé (ou une autre erreur applicative) renvoie un HTTP 200 avec
    // "response: []" et le détail dans "errors" — sans cette vérification, on
    // mettrait en cache "aucun match trouvé" pendant 30 jours à cause d'une simple
    // panne de quota temporaire, empêchant toute nouvelle tentative jusque-là.
    const apiErrors = res.data?.errors;
    if (apiErrors && (Array.isArray(apiErrors) ? apiErrors.length > 0 : Object.keys(apiErrors).length > 0)) {
      throw new Error(`Erreur API-Football: ${JSON.stringify(apiErrors)}`);
    }
    const candidates = (res.data?.response || []).map((r) => r.player);
    // API-Football expose le nom affiché en "P. Nomdefamille" (ex: "B. Barcola"),
    // jamais le prénom complet — comparer au nom complet Transfermarkt ne matchait
    // donc jamais pour les joueurs à deux mots.
    //
    // Pour un nom de famille courant (ex: "Mendes", "Neves"), des centaines
    // d'homonymes sans rapport partagent le même nom de famille — filtrer sur le
    // seul nom de famille laissait alors le départage par âge choisir arbitrairement
    // entre plusieurs candidats du même âge. On exige donc AUSSI que l'initiale du
    // prénom corresponde (via les champs firstname/lastname, plus fiables que le nom
    // affiché abrégé), sauf pour les surnoms mononymes (ex: "Vitinha") où
    // firstname/lastname contiennent l'état civil réel, sans rapport avec le surnom.
    const looseMatches = candidates.filter((c) => {
      if (isMononym) {
        const candidateWords = normalizeName(c.name).split(' ');
        return candidateWords[candidateWords.length - 1] === lastName;
      }
      // Le champ "lastname" est parfois composé (ex: "Mbappé Lottin" pour Kylian
      // Mbappé, où "Lottin" est un second nom de famille) — le nom footballistique
      // pertinent n'est pas toujours le dernier mot, donc on vérifie sa présence
      // n'importe où plutôt que de ne comparer que le dernier token.
      const candidateSurnameWords = normalizeName(c.lastname || c.name).split(' ');
      // Le champ "firstname" est parfois incohérent (vu pour Ousmane Dembélé : firstname
      // = "Masour", un artefact de données, alors que "name" affiche bien "O. Dembélé") —
      // le nom affiché ("name") est le format le plus fiable pour l'initiale.
      const candidateFirstInitial = normalizeName(c.name).split(' ')[0]?.[0];
      return candidateSurnameWords.includes(lastName) && candidateFirstInitial === targetFirstInitial;
    });

    let candidatesToRank = looseMatches;
    // Deux personnes différentes peuvent partager initiale + nom de famille + âge
    // (ex: un "J. Neves" luxembourgeois de 21 ans sans rapport avec João Neves du
    // PSG, aussi âgé de 21 ans) : la nationalité connue via Transfermarkt permet de
    // trancher quand elle réduit le champ des candidats sans l'éliminer entièrement.
    if (looseMatches.length > 1 && expectedNationalities?.length > 0) {
      const normalizedExpected = expectedNationalities.map(normalizeName);
      const nationalityMatches = looseMatches.filter((c) => normalizedExpected.includes(normalizeName(c.nationality)));
      if (nationalityMatches.length > 0) candidatesToRank = nationalityMatches;
    }

    if (candidatesToRank.length === 0) {
      match = null;
    } else if (expectedAge != null) {
      // La vérification d'âge s'applique même s'il ne reste qu'un seul candidat :
      // un profil incomplet (âge inconnu) qui matche par coïncidence initiale+nom
      // de famille n'est pas forcément le bon joueur (vu avec un "O. Dembélé" sans
      // rapport, profil vide, au lieu du vrai Ousmane Dembélé).
      match = candidatesToRank.reduce((best, c) =>
        Math.abs((c.age ?? 999) - expectedAge) < Math.abs((best.age ?? 999) - expectedAge) ? c : best
      );
      // Un écart d'âge trop grand veut dire qu'aucun candidat ne correspond vraiment
      // (mieux vaut ne pas afficher de stats que d'afficher celles d'un homonyme).
      if (Math.abs((match.age ?? 999) - expectedAge) > 2) match = null;
    } else {
      match = candidatesToRank[0];
    }
  } catch (err) {
    console.error(`apiFootball: échec recherche joueur "${playerName}"`, err.message);
    fetchFailed = true;
  }

  if (!fetchFailed) setCached(cacheKey, match, 30 * 24 * 60 * 60);
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

  // Même piège qu'au-dessus : un quota dépassé renvoie 200 avec "response: []" et
  // le détail dans "errors" — ne pas mettre ça en cache 7 jours comme si le joueur
  // n'avait vraiment aucune statistique cette saison-là.
  const apiErrors = data?.errors;
  if (apiErrors && (Array.isArray(apiErrors) ? apiErrors.length > 0 : Object.keys(apiErrors).length > 0)) {
    throw new Error(`Erreur API-Football: ${JSON.stringify(apiErrors)}`);
  }

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
