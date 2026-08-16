import axios from 'axios';
import * as cheerio from 'cheerio';
import { getCached, setCached } from '../cache/store.js';

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

// La date de publication n'est pas dans le HTML des pages d'accueil (chargée en JS
// côté client), donc "il y a Xh" ne s'affichait jamais pour ces deux sources et elles
// n'apparaissaient jamais à leur place dans le flux trié par date. Chaque page
// d'article a en revanche un bloc JSON-LD avec "datePublished". Comme cette date ne
// change jamais une fois l'article publié, on la met en cache indéfiniment (ttl=0)
// par lien : seuls les articles vraiment nouveaux déclenchent une requête à chaque
// cycle de rafraîchissement, pas les ~20 déjà vus.
async function getArticleDate(link) {
  const cacheKey = `article-date:${link}`;
  const cached = getCached(cacheKey);
  if (cached !== null) return cached;

  try {
    const res = await axios.get(link, { headers: HEADERS });
    const match = res.data.match(/"datePublished"\s*:\s*"([^"]+)"/);
    const date = match ? match[1] : null;
    // Ne mettre en cache que si on a vraiment trouvé une date : un échec réseau
    // temporaire ou une page sans JSON-LD ne doit pas bloquer les tentatives
    // suivantes indéfiniment (le cache n'expire jamais).
    if (date) setCached(cacheKey, date, 0);
    return date;
  } catch (err) {
    console.error(`scraping: échec récupération date pour ${link}`, err.message);
    return null;
  }
}

async function scrapeLEquipe() {
  const url = 'https://www.lequipe.fr/Football/';
  const res = await axios.get(url, { headers: HEADERS });
  const $ = cheerio.load(res.data);
  const articles = [];
  const seen = new Set();

  // Le sélecteur cible uniquement les vrais articles ("/Football/Actualites/..."),
  // pas les liens de navigation/catégories qui matchaient trop largement avant.
  // Le titre lisible est dans un <h2>/<h3> imbriqué (plusieurs formats de carte
  // différents sur la page), le texte brut du lien contenant souvent un badge de
  // catégorie collé sans espace ("TransfertsAston Villa...").
  $('a[href*="/Football/Actualites/"]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href || seen.has(href)) return;
    const title = $(el).find('h2, h3').first().text().trim() || $(el).attr('title') || '';
    if (!title || title.length < 10) return;
    seen.add(href);
    const link = href.startsWith('http') ? href : `https://www.lequipe.fr${href}`;
    articles.push({ source: "L'Équipe", title, summary: '', link, publishedAt: null });
  });

  if (articles.length === 0) {
    console.error("scraping: aucun article trouvé sur L'Équipe, structure HTML probablement changée");
  }

  const deduped = dedupe(articles).slice(0, 20);
  await Promise.all(deduped.map(async (a) => { a.publishedAt = await getArticleDate(a.link); }));
  return deduped;
}

async function scrapeFootMercato() {
  const url = 'https://www.footmercato.net/';
  const res = await axios.get(url, { headers: HEADERS });
  const $ = cheerio.load(res.data);
  const articles = [];
  const seen = new Set();

  // Chaque article est dans un <article>, avec son lien ("/a<id>-<slug>") et son
  // titre dans un <h2>/<h3> imbriqué.
  $('article').each((_, el) => {
    const link = $(el).find('a[href*="footmercato.net/a"]').first().attr('href');
    const title = $(el).find('h2, h3').first().text().trim();
    if (!link || !title || title.length < 10 || seen.has(link)) return;
    seen.add(link);
    articles.push({ source: 'Foot Mercato', title, summary: '', link, publishedAt: null });
  });

  if (articles.length === 0) {
    console.error('scraping: aucun article trouvé sur Foot Mercato, structure HTML probablement changée');
  }

  const deduped = dedupe(articles).slice(0, 20);
  await Promise.all(deduped.map(async (a) => { a.publishedAt = await getArticleDate(a.link); }));
  return deduped;
}

function dedupe(articles) {
  const seen = new Set();
  return articles.filter((a) => {
    if (seen.has(a.link)) return false;
    seen.add(a.link);
    return true;
  });
}

function parseFee(text) {
  const clean = text.replace(/[€$£]/g, '').trim();
  const match = clean.match(/^([\d.]+)\s*(m|k)?$/i);
  if (!match) return null;
  const value = parseFloat(match[1]);
  if (match[2]?.toLowerCase() === 'm') return Math.round(value * 1_000_000);
  if (match[2]?.toLowerCase() === 'k') return Math.round(value * 1_000);
  return Math.round(value);
}

export async function getRecordTransfers(seasonId) {
  const url = seasonId
    ? `https://www.transfermarkt.com/transfers/transferrekorde/statistik?saison_id=${encodeURIComponent(seasonId)}&plus=0`
    : 'https://www.transfermarkt.com/transfers/transferrekorde/statistik';
  const res = await axios.get(url, { headers: HEADERS });
  const $ = cheerio.load(res.data);
  const rows = [];

  $('table.items > tbody > tr').each((_, el) => {
    const tds = $(el).find('> td');
    const rank = $(tds[0]).text().trim();
    const player = $(tds[1]).find('a.hauptlink, td.hauptlink a').first().text().trim() || $(tds[1]).find('a').first().text().trim();
    const position = $(tds[1]).find('table tr').eq(1).find('td').text().trim();
    const season = $(tds[2]).text().trim();
    const clubLinks = $(tds[4]).find('table.inline-table a');
    const club = clubLinks.eq(1).text().trim() || clubLinks.first().text().trim();
    const competition = $(tds[4]).find('table.inline-table a').last().text().trim();
    const feeText = $(tds[5]).text().trim();
    const fee = parseFee(feeText);

    if (player && fee) {
      rows.push({ rank: Number(rank) || rows.length + 1, player, position, season, club, competition, fee });
    }
  });

  if (rows.length === 0) {
    console.error('scraping: aucune ligne trouvée sur la page transferts records, structure HTML probablement changée');
  }

  return rows;
}

export async function getLatestTransfers() {
  const url = 'https://www.transfermarkt.com/transfers/neuestetransfers/statistik';
  const res = await axios.get(url, { headers: HEADERS });
  const $ = cheerio.load(res.data);
  const rows = [];

  $('table.items > tbody > tr').each((_, el) => {
    const tds = $(el).find('> td');
    const player = $(tds[0]).find('a.hauptlink, td.hauptlink a').first().text().trim() || $(tds[0]).find('a').first().text().trim();
    const position = $(tds[0]).find('table tr').eq(1).find('td').text().trim();
    const age = $(tds[1]).text().trim();
    const leftClub = $(tds[3]).find('table.inline-table a').eq(1).text().trim() || $(tds[3]).find('table.inline-table a').first().text().trim();
    const joinedClub = $(tds[4]).find('table.inline-table a').eq(1).text().trim() || $(tds[4]).find('table.inline-table a').first().text().trim();
    const feeText = $(tds[5]).text().trim();
    const fee = parseFee(feeText);

    if (player) {
      rows.push({ player, position, age: Number(age) || null, from: leftClub || null, to: joinedClub || null, fee });
    }
  });

  if (rows.length === 0) {
    console.error('scraping: aucune ligne trouvée sur la page derniers transferts, structure HTML probablement changée');
  }

  return rows;
}

function parseMarketValuePage(html) {
  const $ = cheerio.load(html);
  const rows = [];

  $('table.items > tbody > tr').each((_, el) => {
    const tds = $(el).find('> td');
    const rank = $(tds[0]).text().trim();
    const player = $(tds[1]).find('a.hauptlink, td.hauptlink a').first().text().trim() || $(tds[1]).find('a').first().text().trim();
    const position = $(tds[1]).find('table tr').eq(1).find('td').text().trim();
    const age = $(tds[2]).text().trim();
    const club = $(tds[4]).find('a').attr('title')?.trim() || $(tds[4]).find('img').attr('title')?.trim();
    const feeText = $(tds[5]).text().trim();
    const marketValue = parseFee(feeText);

    if (player && marketValue) {
      rows.push({ rank: Number(rank) || rows.length + 1, player, position, age: Number(age) || null, club: club || null, marketValue });
    }
  });

  return rows;
}

export async function getTopMarketValues(maxPages = 20) {
  const baseUrl = 'https://www.transfermarkt.com/spieler-statistik/wertvollstespieler/marktwertetop';
  const rows = [];

  for (let page = 1; page <= maxPages; page++) {
    const url = page === 1 ? baseUrl : `${baseUrl}?page=${page}`;
    try {
      const res = await axios.get(url, { headers: HEADERS });
      const pageRows = parseMarketValuePage(res.data);
      if (pageRows.length === 0) break;
      rows.push(...pageRows);
    } catch (err) {
      console.error(`scraping: échec page ${page} valeurs marchandes`, err.message);
      break;
    }
    if (page < maxPages) await new Promise((r) => setTimeout(r, 700));
  }

  if (rows.length === 0) {
    console.error('scraping: aucune ligne trouvée sur la page valeurs marchandes, structure HTML probablement changée');
  }

  return rows;
}

export async function getScrapedNews() {
  const results = [];

  try {
    results.push(...(await scrapeLEquipe()));
  } catch (err) {
    console.error("scraping: échec récupération L'Équipe", err.message);
  }

  try {
    results.push(...(await scrapeFootMercato()));
  } catch (err) {
    console.error('scraping: échec récupération Foot Mercato', err.message);
  }

  return results;
}
