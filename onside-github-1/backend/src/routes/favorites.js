import { Router } from 'express';
import db from '../config/db.js';
import { getCachedIgnoringTTL } from '../cache/store.js';
import { findTransfermarktClub, refreshFavoriteClubsTransfers } from '../sources/transfermarkt.js';

const router = Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT team_id AS id, team_name AS name FROM favorite_clubs').all();
  res.json(rows);
});

// Le club favori est choisi par navigateur (localStorage côté frontend), pas un
// réglage global unique : plusieurs personnes peuvent donc suivre des clubs
// différents en même temps. On enregistre juste ce club ici pour que le backend
// sache lesquels garder en cache (données Transfermarkt), sans jamais retirer
// les clubs déjà suivis par d'autres navigateurs.
//
// team_id vient de football-data.org (l'identifiant utilisé pour classements/scores),
// alors que les données Transfermarkt (transferts, valeurs marchandes) utilisent leurs
// propres identifiants de club. On résout donc ici le club Transfermarkt correspondant
// par recherche de nom, pour que la mise en cache côté scheduler sache quel club aller
// chercher.
router.post('/', async (req, res) => {
  const { id, name } = req.body || {};
  if (!id || !name) {
    return res.status(400).json({ error: 'id et name requis' });
  }

  let transfermarktId = null;
  try {
    const match = await findTransfermarktClub(name);
    transfermarktId = match?.id || null;
  } catch (err) {
    console.error(`favorites: échec résolution club Transfermarkt pour "${name}"`, err.message);
  }

  db.prepare(
    `INSERT INTO favorite_clubs (team_id, team_name, transfermarkt_id) VALUES (?, ?, ?)
     ON CONFLICT(team_id) DO UPDATE SET team_name = excluded.team_name, transfermarkt_id = excluded.transfermarkt_id`
  ).run(id, name, transfermarktId);
  res.status(201).json({ id, name });

  // Le scheduler ne rafraîchit ce cache qu'une fois par jour : sans ça, un club
  // tout juste ajouté en favori resterait sans données de transferts jusqu'au
  // lendemain. On déclenche donc un rafraîchissement immédiat en tâche de fond
  // (la réponse HTTP est déjà partie, ça ne doit pas ralentir l'utilisateur).
  const clubs = db
    .prepare('SELECT team_id, transfermarkt_id FROM favorite_clubs WHERE transfermarkt_id IS NOT NULL')
    .all()
    .map((r) => ({ footballDataId: r.team_id, transfermarktId: r.transfermarkt_id }));
  if (clubs.length > 0) {
    refreshFavoriteClubsTransfers(clubs).catch((err) =>
      console.error('favorites: échec rafraîchissement Transfermarkt à la demande', err.message)
    );
  }
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM favorite_clubs WHERE team_id = ?').run(req.params.id);
  res.json({ ok: true });
});

router.get('/competitions', (req, res) => {
  const clubId = req.query.clubId;
  if (!clubId) return res.json([]);

  const competitions = db.prepare('SELECT code, name FROM competitions WHERE active = 1').all();
  const matches = [];

  for (const comp of competitions) {
    const standings = getCachedIgnoringTTL(`standings:${comp.code}:current`);
    const table = standings?.standings?.find((s) => s.type === 'TOTAL')?.table || standings?.standings?.[0]?.table || [];
    if (table.some((row) => String(row.team?.id) === String(clubId))) {
      matches.push(comp);
    }
  }

  res.json(matches);
});

export default router;
