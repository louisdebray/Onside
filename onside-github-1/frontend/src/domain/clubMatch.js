const GENERIC_SUFFIXES = new Set(['fc', 'afc', 'cf', 'ac', 'club'])
// Ces mots reviennent dans plusieurs noms de clubs différents (ex: "Saint" dans
// "Paris Saint-Germain" ET "Saint-Étienne", "Olympique" dans Marseille ET Lyon,
// "Borussia" dans Dortmund ET Mönchengladbach) : les compter comme mots distinctifs
// d'un club en particulier créait de faux positifs (un article sur Saint-Étienne
// remontait comme concernant le PSG).
const GENERIC_NAME_PARTS = new Set([
  'saint', 'san', 'santo', 'real', 'athletic', 'atletico', 'sporting',
  'racing', 'deportivo', 'union', 'dynamo', 'dinamo', 'olympique', 'borussia',
])
const STOPWORDS = new Set([...GENERIC_SUFFIXES, ...GENERIC_NAME_PARTS, 'de', 'the'])

const ABBREVIATIONS = {
  'paris saint germain': ['psg'],
  'real madrid': ['real'],
  'fc barcelona': ['barca', 'barça'],
  'manchester united': ['man utd', 'man united', 'mufc'],
  'manchester city': ['man city', 'mcfc'],
  'bayern munich': ['bayern'],
  'olympique de marseille': ['om'],
  'olympique lyonnais': ['ol'],
  'atletico madrid': ['atleti'],
  'atletico de madrid': ['atleti'],
  'tottenham hotspur': ['spurs'],
  'newcastle united': ['nufc'],
}

function normalize(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function significantWords(name) {
  return normalize(name)
    .split(' ')
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w))
}

function coreName(clubName) {
  return normalize(clubName)
    .split(' ')
    .filter((w) => !GENERIC_SUFFIXES.has(w))
    .join(' ')
}

// Un simple mot-clé ne peut pas distinguer "l'article parle vraiment de ce club" de
// "le club est juste cité en passant" (ex: un récap mercato qui mentionne dix clubs
// dans le même paragraphe). Sans lire l'article avec une IA (pas possible gratuitement
// à ce volume), on se rapproche avec deux règles :
//  - mention dans le TITRE → signal fort, on garde toujours ;
//  - mention seulement dans le résumé → on ne garde que si elle apparaît tôt (première
//    phrase), pas noyée plus loin dans un article qui parle d'autre chose.
const SUMMARY_LEAD_CHARS = 120

function matchesAny(text, words, abbrevs) {
  return words.some((w) => text.includes(w)) || abbrevs.some((a) => text.includes(normalize(a)))
}

export function mentionsClub(article, clubName) {
  if (!clubName) return false
  const words = significantWords(clubName)
  const abbrevs = ABBREVIATIONS[coreName(clubName)] || []

  const title = normalize(article.title)
  if (matchesAny(title, words, abbrevs)) return true

  const summaryLead = normalize(article.summary || '').slice(0, SUMMARY_LEAD_CHARS)
  return matchesAny(summaryLead, words, abbrevs)
}
