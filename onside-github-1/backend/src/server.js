import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import './config/db.js';
import { seedCompetitions } from './config/competitions.seed.js';
import { startScheduler } from './cache/scheduler.js';

import matchesRouter from './routes/matches.js';
import standingsRouter from './routes/standings.js';
import fixturesRouter from './routes/fixtures.js';
import transfersRouter from './routes/transfers.js';
import playersRouter from './routes/players.js';
import rumorsRouter from './routes/rumors.js';
import newsRouter from './routes/news.js';
import favoritesRouter from './routes/favorites.js';
import adminRouter from './routes/admin.js';
import teamsRouter from './routes/teams.js';
import matchStatsRouter from './routes/matchStats.js';
import scoutingRouter from './routes/scouting.js';

seedCompetitions();

const app = express();

// ALLOWED_ORIGINS : liste d'origines séparées par des virgules (ex: le site GitHub
// Pages une fois déployé). localhost:5173 reste toujours autorisé pour le dev local.
const allowedOrigins = [
  'http://localhost:5173',
  ...(process.env.ALLOWED_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean),
];
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/matches', matchesRouter);
app.use('/api/standings', standingsRouter);
app.use('/api/fixtures', fixturesRouter);
app.use('/api/transfers', transfersRouter);
app.use('/api/players', playersRouter);
app.use('/api/rumors', rumorsRouter);
app.use('/api/news', newsRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/admin', adminRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/match-stats', matchStatsRouter);
app.use('/api/scouting', scoutingRouter);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  console.error('server: erreur non gérée', err);
  res.status(500).json({ error: 'Erreur interne' });
});

const PORT = process.env.PORT || 4000;

startScheduler();

app.listen(PORT, () => {
  console.log(`Onside backend démarré sur le port ${PORT}`);
});
