import { useEffect, useMemo, useState } from 'react'
import { Card } from './ui/Card'
import { useFavoritesContext } from '../hooks/FavoritesContext'
import { api, endpoints } from '../lib/api'

export function FavoritesSelector() {
  const { favorites, toggleFavorite } = useFavoritesContext()
  const [query, setQuery] = useState('')
  const [teams, setTeams] = useState([])
  const [open, setOpen] = useState(false)
  const current = favorites[0]

  useEffect(() => {
    api.get(endpoints.teams()).then(setTeams).catch(() => setTeams([]))
  }, [])

  const suggestions = useMemo(() => {
    if (!query.trim()) return []
    const q = query.trim().toLowerCase()
    return teams.filter((t) => t.name.toLowerCase().includes(q)).slice(0, 8)
  }, [query, teams])

  const handleSelect = (team) => {
    toggleFavorite({ id: String(team.id), name: team.name })
    setQuery('')
    setOpen(false)
  }

  return (
    <Card className={open && suggestions.length > 0 ? 'relative z-30' : 'relative'}>
      <h2 className="font-display text-base font-semibold">Mon club favori</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {current ? (
          <button
            onClick={() => toggleFavorite(current)}
            className="rounded-full border border-accent/30 bg-accent/15 px-3 py-1 text-xs text-accent hover:bg-accent/25"
          >
            {current.name} ✕
          </button>
        ) : (
          <p className="text-sm text-white/40">Aucun club favori pour le moment.</p>
        )}
      </div>
      <div className="relative mt-3">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={
            current
              ? 'Changer de club (ex: Paris Saint-Germain)'
              : 'Rechercher un club (ex: Paris Saint-Germain)'
          }
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-accent"
        />
        {open && suggestions.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-[#0F141C] shadow-xl">
            {suggestions.map((team) => (
              <li key={team.id}>
                <button
                  onClick={() => handleSelect(team)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-white/10"
                >
                  {team.crest && <img src={team.crest} alt="" className="h-4 w-4" />}
                  {team.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  )
}
