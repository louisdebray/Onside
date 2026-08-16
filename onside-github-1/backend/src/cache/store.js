import db from '../config/db.js';

export function getCached(key) {
  const row = db.prepare('SELECT value_json, updated_at, ttl_seconds FROM cache_kv WHERE key = ?').get(key);
  if (!row) return null;
  const ageSeconds = (Date.now() - row.updated_at) / 1000;
  if (row.ttl_seconds > 0 && ageSeconds > row.ttl_seconds) return null;
  return JSON.parse(row.value_json);
}

export function getCachedIgnoringTTL(key) {
  const row = db.prepare('SELECT value_json FROM cache_kv WHERE key = ?').get(key);
  return row ? JSON.parse(row.value_json) : null;
}

export function setCached(key, data, ttlSeconds = 0) {
  db.prepare(
    `INSERT INTO cache_kv (key, value_json, updated_at, ttl_seconds) VALUES (?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at, ttl_seconds = excluded.ttl_seconds`
  ).run(key, JSON.stringify(data), Date.now(), ttlSeconds);
}
