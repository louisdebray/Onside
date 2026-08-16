const dateFormatter = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
const dayFormatter = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' })
const relativeFormatter = new Intl.RelativeTimeFormat('fr-FR', { numeric: 'auto' })

export function formatMatchDate(isoString) {
  if (!isoString) return ''
  return dateFormatter.format(new Date(isoString))
}

export function formatDay(isoString) {
  if (!isoString) return ''
  return dayFormatter.format(new Date(isoString))
}

export function formatRelativeTime(isoString) {
  if (!isoString) return ''
  const diffMs = new Date(isoString).getTime() - Date.now()
  const diffMinutes = Math.round(diffMs / 60000)
  if (Math.abs(diffMinutes) < 60) return relativeFormatter.format(diffMinutes, 'minute')
  const diffHours = Math.round(diffMinutes / 60)
  if (Math.abs(diffHours) < 24) return relativeFormatter.format(diffHours, 'hour')
  const diffDays = Math.round(diffHours / 24)
  return relativeFormatter.format(diffDays, 'day')
}

export function formatMarketValue(value) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  const num = Number(value)
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')} M€`
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)} k€`
  return `${num} €`
}

export function formatScore(home, away) {
  if (home == null || away == null) return '–:–'
  return `${home}:${away}`
}

const timeFormatter = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })
const fullDateFormatter = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
const monthLabelFormatter = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })

export function formatTime(isoString) {
  if (!isoString) return ''
  return timeFormatter.format(new Date(isoString))
}

export function formatFullDate(isoString) {
  if (!isoString) return ''
  return fullDateFormatter.format(new Date(isoString))
}

// Transfermarkt ne fournit pas toujours une date de transfert fiable (parfois le
// début de la fenêtre de mercato plutôt que la date réelle de signature) ; la
// saison, elle, est toujours correcte, donc on l'affiche à la place d'une date exacte.
export function formatSeason(season) {
  if (!season) return ''
  const [start, end] = season.split('/')
  if (!start || !end) return season
  return `Saison 20${start}/${end}`
}

export function monthKey(isoString) {
  if (!isoString) return 'inconnu'
  const d = new Date(isoString)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

export function monthLabel(isoString) {
  if (!isoString) return 'Date inconnue'
  const label = monthLabelFormatter.format(new Date(isoString))
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function groupByMonth(items, dateGetter, direction = 'desc') {
  const sign = direction === 'asc' ? 1 : -1
  const sorted = [...items].sort((a, b) => sign * (new Date(dateGetter(a)) - new Date(dateGetter(b))))
  const groups = new Map()
  for (const item of sorted) {
    const key = monthKey(dateGetter(item))
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(item)
  }
  return [...groups.entries()].sort((a, b) => sign * a[0].localeCompare(b[0]))
}

const RELIABILITY_LABELS = {
  1: { label: 'Fiable', color: 'accent' },
  2: { label: 'À vérifier', color: 'warning' },
  3: { label: 'Peu fiable', color: 'danger' },
}

export function getReliabilityBadge(tier) {
  return RELIABILITY_LABELS[tier] || null
}

export function classNames(...values) {
  return values.filter(Boolean).join(' ')
}
