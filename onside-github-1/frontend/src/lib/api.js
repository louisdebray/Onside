const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })

  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText)
    throw new Error(message || `Erreur API ${res.status}`)
  }

  if (res.status === 204) return null
  return res.json()
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
}

export const endpoints = {
  standings: (competitionCode, season) => `/api/standings/${competitionCode}${season ? `?season=${season}` : ''}`,
  matches: (competitionCode, season) => `/api/matches/${competitionCode}${season ? `?season=${season}` : ''}`,
  fixtures: (competitionCode) => `/api/fixtures/${competitionCode}`,
  transfers: (clubId) => `/api/transfers${clubId ? `?clubId=${encodeURIComponent(clubId)}` : ''}`,
  transferRecords: (scope) => `/api/transfers/records?scope=${scope}`,
  latestTransfers: () => '/api/transfers/latest',
  marketValues: (scope, clubId) =>
    `/api/transfers/market-values${scope ? `?scope=${scope}` : ''}${clubId ? `${scope ? '&' : '?'}clubId=${encodeURIComponent(clubId)}` : ''}`,
  scoutingSearch: (q) => `/api/scouting/search?q=${encodeURIComponent(q)}`,
  scoutingPlayer: (id) => `/api/scouting/${id}`,
  playerStats: (id, season = 2025) => `/api/players/${id}/stats?season=${season}`,
  rumors: () => '/api/rumors',
  news: () => '/api/news',
  favorites: () => '/api/favorites',
  favoriteCompetitions: (clubId) => `/api/favorites/competitions${clubId ? `?clubId=${encodeURIComponent(clubId)}` : ''}`,
  teams: () => '/api/teams',
  matchStats: (matchId, home, away, date) =>
    `/api/match-stats/${matchId}?home=${encodeURIComponent(home)}&away=${encodeURIComponent(away)}&date=${encodeURIComponent(date)}`,
  adminLogin: () => '/api/admin/login',
  adminCompetitions: () => '/api/admin/competitions',
  adminSourceTiers: () => '/api/admin/source-tiers',
}
