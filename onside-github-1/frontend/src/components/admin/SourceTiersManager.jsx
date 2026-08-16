import { useEffect, useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { api, endpoints } from '../../lib/api'

const TIER_OPTIONS = [
  { value: 1, label: 'Fiable' },
  { value: 2, label: 'À vérifier' },
  { value: 3, label: 'Peu fiable' },
]

export function SourceTiersManager() {
  const [tiers, setTiers] = useState([])
  const [source, setSource] = useState('')
  const [tier, setTier] = useState(1)
  const [error, setError] = useState(null)

  const load = () => {
    api.get(endpoints.adminSourceTiers())
      .then(setTiers)
      .catch(() => setError('Impossible de charger les tiers de fiabilité.'))
  }

  useEffect(load, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!source.trim()) return
    try {
      await api.post(endpoints.adminSourceTiers(), { source_name: source, tier: Number(tier) })
      setSource('')
      load()
    } catch {
      setError("Échec de l'enregistrement.")
    }
  }

  const handleUpdateTier = async (sourceName, newTier) => {
    try {
      await api.post(endpoints.adminSourceTiers(), { source_name: sourceName, tier: Number(newTier) })
      load()
    } catch {
      setError('Échec de la modification.')
    }
  }

  const handleDelete = async (sourceName) => {
    try {
      await api.delete(`${endpoints.adminSourceTiers()}/${encodeURIComponent(sourceName)}`)
      load()
    } catch {
      setError('Échec de la suppression.')
    }
  }

  return (
    <Card>
      <h2 className="font-display text-lg font-semibold">Tiers de fiabilité des sources</h2>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      <ul className="mt-4 flex flex-col gap-2">
        {tiers.map((row) => (
          <li key={row.source_name} className="flex items-center justify-between gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm">
            <span className="min-w-0 truncate">{row.source_name}</span>
            <div className="flex shrink-0 items-center gap-2">
              <select
                value={row.tier}
                onChange={(e) => handleUpdateTier(row.source_name, e.target.value)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm outline-none focus:border-accent"
              >
                {TIER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#0A0E14]">{opt.label}</option>
                ))}
              </select>
              <Button variant="danger" onClick={() => handleDelete(row.source_name)}>Retirer</Button>
            </div>
          </li>
        ))}
        {tiers.length === 0 && <p className="text-sm text-white/40">Aucun tier assigné.</p>}
      </ul>
      <form onSubmit={handleAdd} className="mt-4 flex gap-2">
        <input
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Nom de la source RSS"
          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <select
          value={tier}
          onChange={(e) => setTier(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-accent"
        >
          {TIER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#0A0E14]">{opt.label}</option>
          ))}
        </select>
        <Button type="submit" variant="primary">Enregistrer</Button>
      </form>
    </Card>
  )
}
