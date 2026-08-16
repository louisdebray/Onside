import { Router } from 'express';
import { getPlayerStats } from '../sources/apiFootball.js';

const router = Router();

router.get('/:id/stats', async (req, res) => {
  const { id } = req.params;
  const season = req.query.season || new Date().getFullYear();

  try {
    const data = await getPlayerStats(id, season);
    res.json(data);
  } catch (err) {
    console.error('players: échec appel api-football', err.message);
    res.status(502).json({ error: 'Source API-Football indisponible' });
  }
});

export default router;
