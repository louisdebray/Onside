CREATE TABLE IF NOT EXISTS competitions (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  source_id TEXT
);

CREATE TABLE IF NOT EXISTS source_tiers (
  source_name TEXT PRIMARY KEY,
  tier INTEGER NOT NULL DEFAULT 2
);

CREATE TABLE IF NOT EXISTS favorite_clubs (
  team_id TEXT PRIMARY KEY,
  team_name TEXT NOT NULL,
  transfermarkt_id TEXT
);

CREATE TABLE IF NOT EXISTS cached_articles (
  source_hash TEXT PRIMARY KEY,
  original_text TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS player_stats (
  player_id INTEGER NOT NULL,
  season INTEGER NOT NULL,
  competition TEXT,
  data_json TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (player_id, season, competition)
);

CREATE TABLE IF NOT EXISTS cache_kv (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  ttl_seconds INTEGER NOT NULL DEFAULT 0
);
