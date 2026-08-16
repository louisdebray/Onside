import { Router } from 'express';
import { getUpcomingFixtures } from '../sources/footballData.js';
import { getCached, setCached } from '../cache/store.js';

const router = Router();

router.get('/:competitionCode', async (req, res) => {
  const { competitionCode } = req.params;
  const key = `fixtures:${competitionCode}`;

  const cached = getCached(key);
  if (cached) return res.json(cached);

  try {
    const upcoming = await getUpcomingFixtures(competitionCode);
    setCached(key, upcoming, 24 * 60 * 60);
    res.json(upcoming);
  } catch (err) {
    console.error('fixtures: échec appel football-data', err.message);
    res.status(502).json({ error: 'Source football-data indisponible' });
  }
});

export default router;
