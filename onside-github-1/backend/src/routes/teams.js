import { Router } from 'express';
import db from '../config/db.js';
import { getCachedIgnoringTTL } from '../cache/store.js';

const router = Router();

router.get('/', (req, res) => {
  const competitions = db.prepare('SELECT code FROM competitions WHERE active = 1').all();
  const teamsById = new Map();

  for (const { code } of competitions) {
    const standings = getCachedIgnoringTTL(`standings:${code}:current`);
    const table = standings?.standings?.find((s) => s.type === 'TOTAL')?.table || standings?.standings?.[0]?.table || [];
    for (const row of table) {
      if (row.team?.id) teamsById.set(row.team.id, { id: row.team.id, name: row.team.name, crest: row.team.crest });
    }
  }

  res.json([...teamsById.values()].sort((a, b) => a.name.localeCompare(b.name)));
});

export default router;
