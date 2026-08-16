import { Router } from 'express';
import { getGeneralNews } from '../sources/rss.js';
import { getScrapedNews } from '../sources/scraping.js';
import { getCached, setCached } from '../cache/store.js';
import { db } from '../config/db.js';

const router = Router();

function withReliabilityTiers(items) {
  const tiers = db.prepare('SELECT source_name, tier FROM source_tiers').all();
  const tierMap = new Map(tiers.map((t) => [t.source_name, t.tier]));
  return items.map((item) => ({ ...item, sourceTier: tierMap.get(item.source) ?? null }));
}

router.get('/', async (req, res) => {
  const key = 'news:all';
  const cached = getCached(key);
  if (cached) return res.json(withReliabilityTiers(cached));

  try {
    const [rssNews, scrapedNews] = await Promise.all([getGeneralNews(), getScrapedNews()]);
    const data = [...rssNews, ...scrapedNews].filter((item) => item.link);
    setCached(key, data, 20 * 60);
    res.json(withReliabilityTiers(data));
  } catch (err) {
    console.error('news: échec récupération', err.message);
    res.status(502).json({ error: 'Sources d\'actualité indisponibles' });
  }
});

export default router;
