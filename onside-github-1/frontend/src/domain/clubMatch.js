const GENERIC_SUFFIXES = new Set(['fc', 'afc', 'cf', 'ac', 'club'])
const STOPWORDS = new Set([...GENERIC_SUFFIXES, 'de', 'the'])

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

export function mentionsClub(article, clubName) {
  if (!clubName) return false
  const text = normalize(`${article.title} ${article.summary || ''}`)
  const words = significantWords(clubName)
  if (words.some((w) => text.includes(w))) return true

  const abbrevs = ABBREVIATIONS[coreName(clubName)] || []
  return abbrevs.some((a) => text.includes(normalize(a)))
}
