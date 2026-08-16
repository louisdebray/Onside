import { Router } from 'express';
import { getStandings } from '../sources/footballData.js';
import { getCached, setCached } from '../cache/store.js';

const router = Router();

router.get('/:competitionCode', async (req, res) => {
  const { competitionCode } = req.params;
  const { season } = req.query;
  const key = `standings:${competitionCode}:${season || 'current'}`;

  const cached = getCached(key);
  if (cached) return res.json(cached);

  try {
    const data = await getStandings(competitionCode, season);
    setCached(key, data, season ? 24 * 60 * 60 : 15 * 60);
    res.json(data);
  } catch (err) {
    console.error('standings: échec appel football-data', err.message);
    res.status(502).json({ error: 'Source football-data indisponible' });
  }
});

export default router;
