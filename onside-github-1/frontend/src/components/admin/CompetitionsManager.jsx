import { useEffect, useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { api, endpoints } from '../../lib/api'

export function CompetitionsManager() {
  const [competitions, setCompetitions] = useState([])
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState(null)

  const load = () => {
    api.get(endpoints.adminCompetitions())
      .then(setCompetitions)
      .catch(() => setError('Impossible de charger les compétitions.'))
  }

  useEffect(load, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!name.trim() || !code.trim()) return
    try {
      await api.post(endpoints.adminCompetitions(), { name, code })
      setName('')
      setCode('')
      load()
    } catch {
      setError("Échec de l'ajout.")
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`${endpoints.adminCompetitions()}/${id}`)
      load()
    } catch {
      setError('Échec de la suppression.')
    }
  }

  return (
    <Card>
      <h2 className="font-display text-lg font-semibold">Compétitions actives</h2>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      <ul className="mt-4 flex flex-col gap-2">
        {competitions.map((comp) => (
          <li key={comp.id || comp.code} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-sm">
            <span>{comp.name} <span className="text-white/40">({comp.code})</span></span>
            <Button variant="danger" onClick={() => handleDelete(comp.id || comp.code)}>Retirer</Button>
          </li>
        ))}
        {competitions.length === 0 && <p className="text-sm text-white/40">Aucune compétition configurée.</p>}
      </ul>
      <form onSubmit={handleAdd} className="mt-4 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom (ex: Ligue 1)"
          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Code (ex: FL1)"
          className="w-32 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <Button type="submit" variant="primary">Ajouter</Button>
      </form>
    </Card>
  )
}
