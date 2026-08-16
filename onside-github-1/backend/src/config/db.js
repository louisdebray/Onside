import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', '..', 'onside.sqlite');

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf-8');
db.exec(schema);

// `CREATE TABLE IF NOT EXISTS` ne modifie pas une table déjà créée par une
// version antérieure du schéma ; on ajoute donc les colonnes manquantes ici.
const favoriteClubsColumns = db.prepare("PRAGMA table_info(favorite_clubs)").all().map((c) => c.name);
if (!favoriteClubsColumns.includes('transfermarkt_id')) {
  db.exec('ALTER TABLE favorite_clubs ADD COLUMN transfermarkt_id TEXT');
}

export default db;
