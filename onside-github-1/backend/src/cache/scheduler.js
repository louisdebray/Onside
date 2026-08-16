import cron from 'node-cron';
import db from '../config/db.js';
import { getMatches, getStandings, getUpcomingFixtures, warmUpVenuesCache } from '../sources/footballData.js';
import { setCached } from './store.js';
import { refreshFavoriteClubsTransfers } from '../sources/transfermarkt.js';
import { getGeneralNews } from '../sources/rss.js';
import { getRumors } from '../sources/rss.js';
import { getScrapedNews, getRecordTransfers, getLatestTransfers, getTopMarketValues } from '../sources/scraping.js';

function activeCompetitionCodes() {
  return db.prepare('SELECT code FROM competitions WHERE active = 1').all().map((r) => r.code);
}

async function refreshScoresAndStandings() {
  for (const code of activeCompetitionCodes()) {
    try {
      const matches = await getMatches(code);
      setCached(`matches:${code}:current`, matches, 15 * 60);
    } catch (err) {
      console.error(`scheduler: échec matches ${code}`, err.message);
    }
    try {
      const standings = await getStandings(code);
      setCached(`standings:${code}:current`, standings, 15 * 60);
    } catch (err) {
      console.error(`scheduler: échec standings ${code}`, err.message);
    }
  }
}

async function refreshFixtures() {
  for (const code of activeCompetitionCodes()) {
    try {
      const upcoming = await getUpcomingFixtures(code);
      await warmUpVenuesCache(upcoming.matches);
      const withVenues = { ...upcoming, matches: (await getUpcomingFixtures(code)).matches };
      setCached(`fixtures:${code}`, withVenues, 24 * 60 * 60);
    } catch (err) {
      console.error(`scheduler: échec fixtures ${code}`, err.message);
    }
  }
}

async function refreshTransfermarkt() {
  const clubs = db
    .prepare('SELECT team_id, transfermarkt_id FROM favorite_clubs WHERE transfermarkt_id IS NOT NULL')
    .all()
    .map((r) => ({ footballDataId: r.team_id, transfermarktId: r.transfermarkt_id }));
  if (clubs.length === 0) return;
  try {
    await refreshFavoriteClubsTransfers(clubs);
  } catch (err) {
    console.error('scheduler: échec transfermarkt', err.message);
  }
}

async function refreshTransferRecords() {
  try {
    const rows = await getRecordTransfers(null);
    setCached('transfer-records:alltime', rows, 24 * 60 * 60);
  } catch (err) {
    console.error('scheduler: échec classement transferts records', err.message);
  }
}

async function refreshLatestTransfers() {
  try {
    const rows = await getLatestTransfers();
    setCached('transfers:latest', rows, 60 * 60);
  } catch (err) {
    console.error('scheduler: échec derniers transferts', err.message);
  }
}

async function refreshTopMarketValues() {
  try {
    const rows = await getTopMarketValues();
    setCached('transfers:top-market-values', rows, 24 * 60 * 60);
  } catch (err) {
    console.error('scheduler: échec valeurs marchandes', err.message);
  }
}

async function refreshNewsAndRumors() {
  try {
    const [rssNews, scrapedNews] = await Promise.all([getGeneralNews(), getScrapedNews()]);
    setCached('news:all', [...rssNews, ...scrapedNews], 20 * 60);
  } catch (err) {
    console.error('scheduler: échec news', err.message);
  }
  try {
    const rumors = await getRumors();
    setCached('rumors:all', rumors, 20 * 60);
  } catch (err) {
    console.error('scheduler: échec rumors', err.message);
  }
}

export function startScheduler() {
  cron.schedule('*/15 * * * *', refreshScoresAndStandings);
  cron.schedule('0 4 * * *', refreshFixtures);
  cron.schedule('0 5 * * *', refreshTransfermarkt);
  cron.schedule('30 5 * * *', refreshTransferRecords);
  cron.schedule('0 */2 * * *', refreshLatestTransfers);
  cron.schedule('45 5 * * *', refreshTopMarketValues);
  cron.schedule('*/20 * * * *', refreshNewsAndRumors);
}
