import { useMemo, useState } from 'react'
import { useApi } from '../hooks/useApi'
import { useFavoritesContext } from '../hooks/FavoritesContext'
import { api, endpoints } from '../lib/api'
import { LoadingState } from '../components/ui/LoadingState'
import { ErrorState } from '../components/ui/ErrorState'
import { Card } from '../components/ui/Card'
import { ApiNotice } from '../components/ui/ApiNotice'
import { formatMarketValue } from '../domain/formatters'

const selectClass =
  'rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 outline-none focus:border-accent'

const AGE_OPTIONS = [
  { value: '', label: 'Tous âges' },
  { value: '21', label: '21 ans ou moins' },
  { value: '23', label: '23 ans ou moins' },
  { value: '26', label: '26 ans ou moins' },
  { value: '30', label: '30 ans ou moins' },
]

export function MarketValuesPage() {
  const { favorites } = useFavoritesContext()
  const [scope, setScope] = useState('general')
  const [position, setPosition] = useState('')
  const [maxAge, setMaxAge] = useState('')
  const [club, setClub] = useState('')
  const [clubQuery, setClubQuery] = useState('')
  const [clubDropdownOpen, setClubDropdownOpen] = useState(false)

  const favoriteId = favorites[0]?.id
  const { data, loading, error } = useApi(
    () => api.get(endpoints.marketValues(scope, scope === 'favorites' ? favoriteId : undefined)),
    [scope, favoriteId],
  )

  const clubNames = useMemo(() => new Map(favorites.map((f) => [f.id, f.name])), [favorites])

  const players = useMemo(() => {
    if (!data) return []
    if (scope === 'favorites') {
      return data.map((p) => ({ ...p, club: clubNames.get(String(p.clubId)) || p.clubId }))
    }
    return data
  }, [data, scope, clubNames])

  const positions = useMemo(() => [...new Set(players.map((p) => p.position).filter(Boolean))].sort(), [players])
  const clubs = useMemo(() => [...new Set(players.map((p) => p.club).filter(Boolean))].sort(), [players])
  const clubSuggestions = useMemo(() => {
    if (!clubQuery.trim()) return []
    const q = clubQuery.trim().toLowerCase()
    return clubs.filter((c) => c.toLowerCase().includes(q)).slice(0, 8)
  }, [clubQuery, clubs])

  const filtered = useMemo(() => {
    let list = players
    if (position) list = list.filter((p) => p.position === position)
    if (club) list = list.filter((p) => p.club === club)
    if (maxAge) list = list.filter((p) => p.age != null && p.age <= Number(maxAge))
    return [...list].sort((a, b) => (b.marketValue || 0) - (a.marketValue || 0))
  }, [players, position, club, maxAge])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Valeurs marchandes</h1>
        <p className="mt-1 text-sm text-white/40">
          {scope === 'general' ? 'Les joueurs les plus valorisés, tous clubs confondus.' : "Basé sur l'effectif de ton club favori."}
        </p>
        <ApiNotice>Données fournies par une API externe gratuite, parfois temporairement indisponible.</ApiNotice>
      </div>

      <Card className={clubDropdownOpen && clubSuggestions.length > 0 ? 'relative z-30 flex flex-wrap gap-3' : 'relative flex flex-wrap gap-3'}>
        <select value={scope} onChange={(e) => setScope(e.target.value)} className={selectClass}>
          <option value="general" className="bg-[#0A0E14]">Tous les clubs</option>
          <option value="favorites" className="bg-[#0A0E14]">Mon club favori</option>
        </select>
        <select value={position} onChange={(e) => setPosition(e.target.value)} className={selectClass}>
          <option value="" className="bg-[#0A0E14]">Tous postes</option>
          {positions.map((p) => (
            <option key={p} value={p} className="bg-[#0A0E14]">
              {p}
            </option>
          ))}
        </select>
        <select value={maxAge} onChange={(e) => setMaxAge(e.target.value)} className={selectClass}>
          {AGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#0A0E14]">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="relative">
          <input
            value={club || clubQuery}
            onChange={(e) => {
              setClub('')
              setClubQuery(e.target.value)
              setClubDropdownOpen(true)
            }}
            onFocus={() => setClubDropdownOpen(true)}
            onBlur={() => setTimeout(() => setClubDropdownOpen(false), 150)}
            placeholder="Rechercher un club"
            className={`w-56 ${selectClass}`}
          />
          {club && (
            <button
              onClick={() => {
                setClub('')
                setClubQuery('')
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
            >
              ✕
            </button>
          )}
          {clubDropdownOpen && clubSuggestions.length > 0 && (
            <ul className="absolute left-0 right-0 z-20 mt-1 max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-[#0F141C] shadow-xl">
              {clubSuggestions.map((c) => (
                <li key={c}>
                  <button
                    onClick={() => {
                      setClub(c)
                      setClubQuery('')
                      setClubDropdownOpen(false)
                    }}
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-white/10"
                  >
                    {c}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      {loading && <LoadingState label="Chargement des valeurs marchandes…" />}
      {error && <ErrorState label="Valeurs marchandes indisponibles pour le moment." />}
      {!loading && !error && (
        <div className="overflow-x-auto rounded-2xl glass-secondary">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-white/40">
                <th className="px-4 py-3">Joueur</th>
                <th className="px-3 py-3 text-right">Valeur marchande</th>
                <th className="px-3 py-3">Poste</th>
                <th className="px-3 py-3 text-center">Âge</th>
                <th className="px-3 py-3">Club</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, idx) => (
                <tr key={p.id || `${p.player}-${idx}`} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-2.5 font-medium">{p.name || p.player}</td>
                  <td className="px-3 py-2.5 text-right stat-value font-semibold text-accent">
                    {formatMarketValue(p.marketValue)}
                  </td>
                  <td className="px-3 py-2.5 text-white/60">{p.position}</td>
                  <td className="px-3 py-2.5 text-center stat-value">{p.age ?? '—'}</td>
                  <td className="px-3 py-2.5 text-white/60">{p.club}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-white/40">
                    Aucun joueur pour ce filtre.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
