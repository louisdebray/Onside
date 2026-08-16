import Parser from 'rss-parser';
import { translateToFrench } from './translate.js';

const parser = new Parser({
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },
});

const NEWS_FEEDS = [
  { name: 'BBC Sport Football', url: 'https://feeds.bbci.co.uk/sport/football/rss.xml', translate: true, lang: 'en' },
  { name: 'The Guardian Football', url: 'https://www.theguardian.com/football/rss', translate: true, lang: 'en' },
  { name: 'Marca', url: 'https://e00-marca.uecdn.es/rss/futbol.xml', translate: true, lang: 'es' },
  { name: 'AS', url: 'https://as.com/rss/futbol/portada.xml', translate: true, lang: 'es' },
  { name: 'Gazzetta dello Sport', url: 'https://www.gazzetta.it/rss/calcio.xml', translate: true, lang: 'it' },
  { name: 'Corriere dello Sport', url: 'https://www.corrieredellosport.it/rss/calcio', translate: true, lang: 'it' },
];

const RUMOR_FEEDS = [
  { name: 'Fabrizio Romano', url: 'https://thedailybriefing.io/feed' },
];

const HAWKINS_FEED = { name: 'Fabrice Hawkins', url: 'https://rmcsport.bfmtv.com/rss/football/' };

async function fetchFeed(url) {
  const feed = await parser.parseURL(url);
  return feed.items || [];
}

// RMC's feed mixes real articles (link suffix _AV-/_LN-/_VN-) with static player/club
// profile pages (suffix _DN-), which aren't news and shouldn't be shown as such.
function isProfilePage(link) {
  return /_DN-\d+\.html?$/i.test(link || '');
}

function dedupeByLink(articles) {
  const seen = new Set();
  return articles.filter((a) => {
    if (!a.link || seen.has(a.link)) return false;
    seen.add(a.link);
    return true;
  });
}

async function toArticle(item, source, translate, lang = 'en') {
  const title = translate ? await translateToFrench(item.title || '', lang) : item.title || '';
  const summary = translate ? await translateToFrench(item.contentSnippet || '', lang) : item.contentSnippet || '';
  return {
    source,
    title,
    summary,
    link: item.link,
    publishedAt: item.isoDate || item.pubDate || null,
  };
}

export async function getGeneralNews() {
  const articles = [];

  for (const feed of NEWS_FEEDS) {
    try {
      const items = await fetchFeed(feed.url);
      for (const item of items) {
        try {
          articles.push(await toArticle(item, feed.name, feed.translate, feed.lang));
        } catch (err) {
          console.error(`rss: échec traduction item ${feed.name}`, err.message);
        }
      }
    } catch (err) {
      console.error(`rss: échec récupération flux ${feed.name}`, err.message);
    }
  }

  try {
    const hawkinsItems = await fetchFeed(HAWKINS_FEED.url);
    for (const item of hawkinsItems) {
      if (isProfilePage(item.link)) continue;
      const text = `${item.title || ''} ${item.contentSnippet || ''}`;
      if (!/hawkins/i.test(text)) {
        articles.push(await toArticle(item, 'RMC Sport', false));
      }
    }
  } catch (err) {
    console.error('rss: échec récupération flux RMC Sport (filtrage Hawkins)', err.message);
  }

  return dedupeByLink(articles);
}

export async function getRumors() {
  const rumors = [];

  for (const feed of RUMOR_FEEDS) {
    try {
      const items = await fetchFeed(feed.url);
      for (const item of items) {
        rumors.push(await toArticle(item, feed.name, false));
      }
    } catch (err) {
      console.error(`rss: échec récupération rumeurs ${feed.name}`, err.message);
    }
  }

  try {
    const hawkinsItems = await fetchFeed(HAWKINS_FEED.url);
    for (const item of hawkinsItems) {
      if (isProfilePage(item.link)) continue;
      const text = `${item.title || ''} ${item.contentSnippet || ''}`;
      if (/hawkins/i.test(text)) {
        rumors.push(await toArticle(item, HAWKINS_FEED.name, false));
      }
    }
  } catch (err) {
    console.error('rss: échec récupération flux RMC Sport (rumeurs Hawkins)', err.message);
  }

  return dedupeByLink(rumors);
}
