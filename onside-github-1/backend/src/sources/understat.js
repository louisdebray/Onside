import axios from 'axios';
import * as cheerio from 'cheerio';

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'X-Requested-With': 'XMLHttpRequest',
  Referer: 'https://understat.com/',
};

export async function searchUnderstatPlayers(query) {
  const res = await axios.get(`https://understat.com/main/getPlayersName/${encodeURIComponent(query)}`, {
    headers: HEADERS,
  });
  return res.data?.response?.players || [];
}

export async function getUnderstatPlayerData(understatId) {
  const res = await axios.get(`https://understat.com/main/getPlayerData/${understatId}`, { headers: HEADERS });
  return res.data;
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

export async function getUnderstatMatchInfo(matchId) {
  const res = await axios.get(`https://understat.com/match/${matchId}`, { headers: HEADERS });
  const $ = cheerio.load(res.data);
  const scriptText = $('script:contains("match_info")').first().html() || '';
  const match = scriptText.match(/var match_info\s*=\s*JSON\.parse\('([^']+)'\)/);
  if (!match) return null;
  const jsonEscaped = match[1].replace(/\\x([0-9a-fA-F]{2})/g, '\\u00$1');
  return JSON.parse(JSON.parse(`"${jsonEscaped}"`));
}

const STOPWORDS = new Set(['fc', 'afc', 'cf', 'ac', 'cd', 'sc', 'ss', 'as', 'club', 'stade', 'the', 'de', 'real', '1901', '1899', '1900', '1902', '1903', '1904', '1905', '1906', '1907', '1908', '1909', '1910']);

function significantWords(name) {
  return normalizeName(name)
    .split(' ')
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w));
}

export function sameTeam(a, b) {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return false;
  if (na.includes(nb) || nb.includes(na)) return true;

  const wordsA = significantWords(a);
  const wordsB = significantWords(b);
  return wordsA.some((wa) => wordsB.some((wb) => wa.slice(0, 4) === wb.slice(0, 4)));
}

export async function findUnderstatMatchByPlayer(understatPlayerId, homeTeamName, awayTeamName, utcDate) {
  const targetDate = utcDate?.slice(0, 10);
  const data = await getUnderstatPlayerData(understatPlayerId);
  const candidates = (data.matches || []).filter((m) => m.date === targetDate);
  if (candidates.length === 0) return null;

  const withTeamMatch = candidates.find(
    (m) =>
      (sameTeam(m.h_team, homeTeamName) && sameTeam(m.a_team, awayTeamName)) ||
      (sameTeam(m.h_team, awayTeamName) && sameTeam(m.a_team, homeTeamName)),
  );
  // The player was already confirmed to be on one of these two clubs, so a same-date
  // match is a reliable signal even if the club's full/formal name doesn't fuzzy-match
  // (e.g. "Stade Rennais FC 1901" vs Understat's "Rennes").
  return (withTeamMatch || candidates[0])?.id || null;
}

export async function findUnderstatPlayer(playerName) {
  const target = normalizeName(playerName);
  const lastName = normalizeName(playerName).split(' ').slice(-1)[0];
  const candidates = await searchUnderstatPlayers(lastName);
  const exact = candidates.find((c) => normalizeName(c.player) === target);
  return exact || candidates.find((c) => normalizeName(c.player).includes(target.split(' ')[0])) || null;
}
