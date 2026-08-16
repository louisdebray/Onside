import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useApi } from '../hooks/useApi'
import { api, endpoints } from '../lib/api'
import { PlayerHeader } from '../components/players/PlayerHeader'
import { PlayerStatsTable } from '../components/players/PlayerStatsTable'
import { LoadingState } from '../components/ui/LoadingState'
import { ErrorState } from '../components/ui/ErrorState'
import { Card } from '../components/ui/Card'

export function PlayerPage() {
  const { id } = useParams()
  const [season] = useState(2025)
  const { data, loading, error } = useApi(() => api.get(endpoints.playerStats(id, season)), [id, season])

  if (loading) return <LoadingState label="Chargement de la fiche joueur…" />
  if (error) return <ErrorState label="Fiche joueur indisponible." />
  if (!data) return null

  const player = data.player || data
  const seasons = data.seasons || []
  const form = data.form || []
  const headToHead = data.headToHead

  return (
    <div className="flex flex-col gap-6">
      <PlayerHeader player={player} />

      <section>
        <h2 className="font-display text-lg font-semibold">Statistiques par saison</h2>
        <div className="mt-4">
          {seasons.length > 0 ? (
            <PlayerStatsTable seasons={seasons} />
          ) : (
            <ErrorState label="Aucune statistique disponible." />
          )}
        </div>
      </section>

      {form.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-semibold">Forme récente</h2>
          <div className="mt-3 flex gap-2">
            {form.map((entry, idx) => (
              <Card key={idx} className="px-3 py-2 text-center text-xs">
                <p className="stat-value font-semibold">{entry.result}</p>
                <p className="mt-1 text-white/40">{entry.opponent}</p>
              </Card>
            ))}
          </div>
        </section>
      )}

      {headToHead && (
        <section>
          <h2 className="font-display text-lg font-semibold">Face à face</h2>
          <Card className="mt-3">
            <p className="text-sm text-white/70">{headToHead.summary}</p>
          </Card>
        </section>
      )}
    </div>
  )
}
