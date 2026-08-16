import { Router } from 'express';
import db from '../config/db.js';
import { adminAuth, createSessionToken } from '../middleware/adminAuth.js';

const router = Router();

router.post('/login', (req, res) => {
  const { password } = req.body || {};
  if (!process.env.ADMIN_PASSWORD) {
    return res.status(500).json({ error: 'ADMIN_PASSWORD non configuré côté serveur' });
  }
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Mot de passe incorrect' });
  }
  const token = createSessionToken();
  res.cookie('onside_admin_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.json({ ok: true });
});

router.use(adminAuth);

router.get('/competitions', (req, res) => {
  res.json(db.prepare('SELECT * FROM competitions').all());
});

router.post('/competitions', (req, res) => {
  const { code, name, source_id } = req.body || {};
  if (!code || !name) return res.status(400).json({ error: 'code et name requis' });
  db.prepare(
    'INSERT INTO competitions (code, name, active, source_id) VALUES (?, ?, 1, ?) ON CONFLICT(code) DO UPDATE SET name = excluded.name, source_id = excluded.source_id, active = 1'
  ).run(code, name, source_id || code);
  res.status(201).json({ code, name, source_id: source_id || code });
});

router.delete('/competitions/:code', (req, res) => {
  db.prepare('UPDATE competitions SET active = 0 WHERE code = ?').run(req.params.code);
  res.json({ ok: true });
});

router.get('/source-tiers', (req, res) => {
  res.json(db.prepare('SELECT * FROM source_tiers').all());
});

router.post('/source-tiers', (req, res) => {
  const { source_name, tier } = req.body || {};
  if (!source_name || tier == null) return res.status(400).json({ error: 'source_name et tier requis' });
  db.prepare(
    'INSERT INTO source_tiers (source_name, tier) VALUES (?, ?) ON CONFLICT(source_name) DO UPDATE SET tier = excluded.tier'
  ).run(source_name, tier);
  res.status(201).json({ source_name, tier });
});

router.delete('/source-tiers/:name', (req, res) => {
  db.prepare('DELETE FROM source_tiers WHERE source_name = ?').run(req.params.name);
  res.json({ ok: true });
});

export default router;
