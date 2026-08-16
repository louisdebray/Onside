import db from './db.js';

const COMPETITIONS = [
  { code: 'PL', name: 'Premier League' },
  { code: 'ELC', name: 'Championship' },
  { code: 'BL1', name: 'Bundesliga' },
  { code: 'SA', name: 'Serie A' },
  { code: 'PD', name: 'LaLiga' },
  { code: 'FL1', name: 'Ligue 1' },
  { code: 'DED', name: 'Eredivisie' },
  { code: 'PPL', name: 'Liga Portugal' },
  { code: 'CL', name: 'Champions League' },
  { code: 'WC', name: 'Coupe du Monde' },
  { code: 'EC', name: 'Euro' },
];

export function seedCompetitions() {
  const count = db.prepare('SELECT COUNT(*) AS n FROM competitions').get().n;
  if (count > 0) return;

  const insert = db.prepare(
    'INSERT INTO competitions (code, name, active, source_id) VALUES (@code, @name, 1, @code)'
  );
  const insertMany = db.transaction((rows) => {
    for (const row of rows) insert.run(row);
  });
  insertMany(COMPETITIONS);
}
