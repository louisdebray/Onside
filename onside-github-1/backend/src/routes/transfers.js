import { Router } from 'express';
import { getCached, setCached } from '../cache/store.js';
import { getRecordTransfers, getLatestTransfers, getTopMarketValues } from '../sources/scraping.js';

const router = Router();

function currentSeasonId() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const startYear = now.getUTCMonth() >= 6 ? year : year - 1;
  return `${String(startYear).slice(2)}/${String(startYear + 1).slice(2)}`;
}

router.get('/', (req, res) => {
  const data = getCached('transfermarkt:transfers');
  if (!data) {
    return res.status(503).json({ error: 'Aucune donnée de transfert disponible pour le moment (ajoutez des clubs favoris)' });
  }

  const { clubId } = req.query;
  // Chaque navigateur a son propre club favori : quand clubId est fourni, on ne
  // renvoie que les transferts de ce club-là, pas ceux de tous les clubs suivis
  // par d'autres navigateurs.
  const recentTransfers = clubId
    ? data.recentTransfers.filter((t) => String(t.clubId) === String(clubId))
    : data.recentTransfers;
  const withFee = recentTransfers.filter((t) => t.fee != null);
  const mostExpensiveFavorites = [...withFee].sort((a, b) => b.fee - a.fee).slice(0, 20);

  res.json({ recentTransfers, mostExpensiveFavorites });
});

router.get('/latest', async (req, res) => {
  const key = 'transfers:latest';
  const cached = getCached(key);
  if (cached) return res.json(cached);

  try {
    const rows = await getLatestTransfers();
    setCached(key, rows, 60 * 60);
    res.json(rows);
  } catch (err) {
    console.error('transfers: échec récupération derniers transferts', err.message);
    res.status(502).json({ error: 'Derniers transferts indisponibles' });
  }
});

router.get('/market-values', async (req, res) => {
  if (req.query.scope === 'favorites') {
    const data = getCached('transfermarkt:transfers');
    if (!data) {
      return res.status(503).json({ error: 'Aucune donnée disponible pour le moment (ajoutez des clubs favoris)' });
    }
    const { clubId } = req.query;
    const marketValues = clubId
      ? data.marketValues.filter((p) => String(p.clubId) === String(clubId))
      : data.marketValues;
    return res.json(marketValues);
  }

  const key = 'transfers:top-market-values';
  const cached = getCached(key);
  if (cached) return res.json(cached);

  try {
    const rows = await getTopMarketValues();
    setCached(key, rows, 24 * 60 * 60);
    res.json(rows);
  } catch (err) {
    console.error('transfers: échec récupération valeurs marchandes', err.message);
    res.status(502).json({ error: 'Valeurs marchandes indisponibles' });
  }
});

router.get('/records', async (req, res) => {
  const scope = req.query.scope === 'window' ? 'window' : 'alltime';
  const key = 'transfer-records:alltime';

  try {
    let allTime = getCached(key);
    if (!allTime) {
      allTime = await getRecordTransfers(null);
      setCached(key, allTime, 24 * 60 * 60);
    }

    if (scope === 'alltime') return res.json(allTime);

    const season = currentSeasonId();
    res.json(allTime.filter((row) => row.season === season));
  } catch (err) {
    console.error('transfers: échec récupération classement transferts records', err.message);
    res.status(502).json({ error: 'Classement des transferts records indisponible' });
  }
});

export default router;
