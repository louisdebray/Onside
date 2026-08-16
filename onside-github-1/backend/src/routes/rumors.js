import { Router } from 'express';
import { getRumors } from '../sources/rss.js';
import { getCached, setCached } from '../cache/store.js';

const router = Router();

router.get('/', async (req, res) => {
  const key = 'rumors:all';
  const cached = getCached(key);
  if (cached) return res.json(cached);

  try {
    const data = (await getRumors()).filter((item) => item.link);
    setCached(key, data, 20 * 60);
    res.json(data);
  } catch (err) {
    console.error('rumors: échec récupération', err.message);
    res.status(502).json({ error: 'Sources de rumeurs indisponibles' });
  }
});

export default router;
