import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, endpoints } from '../lib/api'
import { Card } from '../components/ui/Card'
import { PlayerScoutingModal } from '../components/scouting/PlayerScoutingModal'
import { ApiNotice } from '../components/ui/ApiNotice'
import { formatMarketValue } from '../domain/formatters'

export function ScoutingPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    if (query.trim().toLowerCase() === 'admin') {
      setResults([])
      navigate('/admin')
      return
    }
    if (query.trim().length < 2) {
      setResults([])
      return
    }
    const handle = setTimeout(() => {
      api
        .get(endpoints.scoutingSearch(query.trim()))
        .then(setResults)
        .catch(() => setResults([]))
    }, 300)
    return () => clearTimeout(handle)
  }, [query, navigate])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Scouting</h1>
        <p className="mt-1 text-sm text-white/40">Recherche n'importe quel joueur pour voir sa fiche détaillée.</p>
        <ApiNotice>Données fournies par des API externes gratuites, parfois temporairement indisponibles.</ApiNotice>
      </div>

      <Card className={open && results.length > 0 ? 'relative z-30' : 'relative'}>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Rechercher un joueur (ex: Mbappé)"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-accent"
        />
        {open && results.length > 0 && (
          <ul className="absolute left-0 right-0 z-20 mt-1 max-h-80 overflow-y-auto rounded-xl border border-white/10 bg-[#0F141C] shadow-xl">
            {results.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => {
                    setSelectedId(p.id)
                    setQuery('')
                    setOpen(false)
                  }}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-white/10"
                >
                  <span>
                    <span className="font-medium">{p.name}</span>
                    <span className="ml-2 text-xs text-white/40">
                      {p.position} · {p.club}
                    </span>
                  </span>
                  {p.marketValue != null && (
                    <span className="stat-value shrink-0 text-xs text-accent">{formatMarketValue(p.marketValue)}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {selectedId && (
        <PlayerScoutingModal playerId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  )
}
