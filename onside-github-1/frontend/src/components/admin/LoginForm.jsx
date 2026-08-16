import { useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { api, endpoints } from '../../lib/api'

export function LoginForm({ onSuccess }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await api.post(endpoints.adminLogin(), { password })
      onSuccess()
    } catch {
      setError('Mot de passe incorrect ou serveur indisponible.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card variant="primary" className="mx-auto max-w-sm">
      <h1 className="font-display text-xl font-bold">Administration</h1>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe"
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-accent"
        />
        {error && <p className="text-xs text-danger">{error}</p>}
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? 'Connexion…' : 'Se connecter'}
        </Button>
      </form>
    </Card>
  )
}
