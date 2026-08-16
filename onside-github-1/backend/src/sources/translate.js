import axios from 'axios';
import crypto from 'node:crypto';
import db from '../config/db.js';

function hashText(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

export async function translateToFrench(text, sourceLang = 'en') {
  if (!text || !text.trim()) return text;

  const sourceHash = hashText(`${sourceLang}:${text}`);
  const cached = db.prepare('SELECT translated_text FROM cached_articles WHERE source_hash = ?').get(sourceHash);
  if (cached) return cached.translated_text;

  const chunk = text.slice(0, 490);
  const res = await axios.get('https://api.mymemory.translated.net/get', {
    params: {
      q: chunk,
      langpair: `${sourceLang}|fr`,
      // Passer un email de contact fait passer le quota gratuit MyMemory de
      // ~1000 à 50 000 mots/jour (fonctionnalité documentée, aucune inscription
      // requise) — indispensable vu le volume d'articles à traduire.
      de: process.env.MYMEMORY_CONTACT_EMAIL || undefined,
    },
  });
  const translated = res.data?.responseData?.translatedText;
  // Quand le quota est dépassé, MyMemory répond 200 avec ce message en guise de
  // "traduction" au lieu d'une vraie erreur HTTP — sans cette détection, le message
  // d'avertissement serait mis en cache et resservi indéfiniment comme traduction.
  if (!translated || /MYMEMORY WARNING/i.test(translated)) {
    throw new Error('Quota de traduction MyMemory dépassé');
  }

  db.prepare(
    'INSERT INTO cached_articles (source_hash, original_text, translated_text, created_at) VALUES (?, ?, ?, ?) ON CONFLICT(source_hash) DO NOTHING'
  ).run(sourceHash, text, translated, Date.now());

  return translated;
}
