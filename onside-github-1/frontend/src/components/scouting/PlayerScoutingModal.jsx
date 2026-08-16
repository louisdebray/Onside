import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../ui/Modal'
import { LoadingState } from '../ui/LoadingState'
import { ShotMap } from './ShotMap'
import { api, endpoints } from '../../lib/api'
import { formatMarketValue, formatFullDate } from '../../domain/formatters'

function StatTile({ label, value }) {
  return (
    <div className="rounded-xl bg-white/5 px-3 py-2 text-center">
      <p className="stat-value text-lg font-semibold text-accent">{value}</p>
      <p className="mt-0.5 text-[10px] uppercase tracking-wide text-white/40">{label}</p>
    </div>
  )
}

function pct(part, total) {
  if (!total) return null
  return `${Math.round((part / total) * 100)}%`
}

function AdvancedStatsCard({ stats }) {
  const duelsPct = pct(stats.duelsWon, stats.duelsTotal)
  const dribblesPct = pct(stats.dribblesSuccess, stats.dribblesAttempts)
  return (
    <div className="rounded-xl bg-white/5 p-3">
      <div className="flex items-center justify-between">
        <p className="font-display text-sm font-semibold">{stats.competition}</p>
        {stats.rating && <span className="stat-value text-sm font-semibold text-accent">★ {stats.rating}</span>}
      </div>
      <p className="mt-0.5 text-xs text-white/40">
        {stats.team} · {stats.appearances} matchs · {stats.minutes} min
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
        <StatTile label={`Duels gagnés${stats.duelsTotal ? ` (${stats.duelsWon}/${stats.duelsTotal})` : ''}`} value={duelsPct || '—'} />
        <StatTile label={`Dribbles réussis${stats.dribblesAttempts ? ` (${stats.dribblesSuccess}/${stats.dribblesAttempts})` : ''}`} value={dribblesPct || '—'} />
        <StatTile label="Tacles" value={stats.tackles ?? '—'} />
        <StatTile label="Interceptions" value={stats.interceptions ?? '—'} />
        <StatTile label="Fautes provoquées" value={stats.foulsDrawn ?? '—'} />
        <StatTile label="Fautes commises" value={stats.foulsCommitted ?? '—'} />
        <StatTile label="Cartons" value={`${stats.yellowCards ?? 0}🟨 ${stats.redCards ?? 0}🟥`} />
        {(stats.penaltyScored || stats.penaltyMissed) ? (
          <StatTile label="Penalties" value={`${stats.penaltyScored ?? 0}/${(stats.penaltyScored ?? 0) + (stats.penaltyMissed ?? 0)}`} />
        ) : (
          <StatTile label="Penalties" value="—" />
        )}
      </div>
    </div>
  )
}

export function PlayerScoutingModal({ playerId, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [seasonIndex, setSeasonIndex] = useState(0)

  useEffect(() => {
    if (!playerId) return
    setLoading(true)
    api
      .get(endpoints.scoutingPlayer(playerId))
      .then((res) => {
        setData(res)
        setSeasonIndex(0)
      })
      .catch(() => setData({ error: true }))
      .finally(() => setLoading(false))
  }, [playerId])

  const seasonStats = data?.seasons?.[seasonIndex]
  const seasonShots = useMemo(
    () => (data?.shots || []).filter((s) => s.season === seasonStats?.season),
    [data, seasonStats],
  )
  const recentMarketValues = useMemo(
    () => [...(data?.marketValueHistory || [])].reverse().slice(0, 6),
    [data],
  )

  if (!playerId) return null

  return (
    <Modal onClose={onClose}>
      {loading && <LoadingState label="Chargement de la fiche joueur…" />}

      {!loading && data?.error && (
        <p className="text-sm text-white/50">Fiche joueur indisponible pour le moment.</p>
      )}

      {!loading && data && !data.error && (
        <div className="flex max-h-[80vh] flex-col gap-5 overflow-y-auto">
          <div className="flex items-center gap-4">
            {data.profile.imageUrl && (
              <img src={data.profile.imageUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
            )}
            <div className="min-w-0">
              <h2 className="font-display text-lg font-bold">{data.profile.name}</h2>
              <p className="truncate text-sm text-white/50">
                {data.profile.club} · {data.profile.position}
              </p>
              {(data.profile.citizenship?.length > 0 || data.profile.placeOfBirth?.city) && (
                <p className="truncate text-xs text-white/40">
                  {data.profile.placeOfBirth?.city && `Né(e) à ${data.profile.placeOfBirth.city}`}
                  {data.profile.placeOfBirth?.city && data.profile.citizenship?.length > 0 && ' · '}
                  {data.profile.citizenship?.join(', ')}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-sm sm:grid-cols-4">
            <StatTile label="Valeur marchande" value={formatMarketValue(data.profile.marketValue)} />
            <StatTile label="Âge" value={data.profile.age ?? '—'} />
            <StatTile label="Taille" value={data.profile.height ? `${data.profile.height} cm` : '—'} />
            <StatTile label="Pied" value={data.profile.foot || '—'} />
            {data.advancedStats?.weight && <StatTile label="Poids" value={`${data.advancedStats.weight} kg`} />}
            {data.advancedStats?.injured != null && (
              <StatTile label="Blessé" value={data.advancedStats.injured ? 'Oui' : 'Non'} />
            )}
          </div>

          {recentMarketValues.length > 0 && (
            <div>
              <h3 className="mb-2 font-display text-sm font-semibold text-white/70">Évolution de la valeur marchande</h3>
              <ul className="flex flex-col gap-1 text-sm">
                {recentMarketValues.map((v, idx) => (
                  <li key={idx} className="flex items-center justify-between gap-2 border-b border-white/5 py-1.5 last:border-0">
                    <span className="min-w-0 truncate text-white/60">
                      {formatFullDate(v.date)} · {v.clubName}
                    </span>
                    <span className="stat-value shrink-0 font-semibold text-accent">{formatMarketValue(v.marketValue)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.seasons?.length > 0 ? (
            <>
              <div className="flex flex-col gap-2">
                <h3 className="font-display text-sm font-semibold text-white/70">
                  Statistiques par saison <span className="font-normal text-white/40">(championnat national uniquement)</span>
                </h3>
                <select
                  value={seasonIndex}
                  onChange={(e) => setSeasonIndex(Number(e.target.value))}
                  className="w-full max-w-full rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm outline-none focus:border-accent"
                >
                  {data.seasons.map((s, idx) => (
                    <option key={`${s.season}-${s.team}-${idx}`} value={idx} className="bg-[#0A0E14]">
                      {s.season}/{String(Number(s.season) + 1).slice(2)} · {s.team}
                    </option>
                  ))}
                </select>
              </div>

              {seasonStats && (
                <>
                  <p className="text-xs text-white/40">{seasonStats.team}</p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    <StatTile label="Matchs" value={seasonStats.games} />
                    <StatTile label="Minutes" value={seasonStats.time} />
                    <StatTile label="Buts" value={seasonStats.goals} />
                    <StatTile label="Passes déc." value={seasonStats.assists} />
                    <StatTile label="xG" value={Number(seasonStats.xG).toFixed(2)} />
                    <StatTile label="xA" value={Number(seasonStats.xA).toFixed(2)} />
                    <StatTile label="Tirs" value={seasonStats.shots} />
                    <StatTile label="Passes clés" value={seasonStats.key_passes} />
                    <StatTile label="Buts hors pen." value={seasonStats.npg} />
                    <StatTile label="xG hors pen." value={Number(seasonStats.npxG).toFixed(2)} />
                    <StatTile label="Cartons jaunes" value={seasonStats.yellow} />
                    <StatTile label="Cartons rouges" value={seasonStats.red} />
                  </div>

                  <div>
                    <h3 className="mb-2 font-display text-sm font-semibold text-white/70">Carte des tirs (saison)</h3>
                    <ShotMap shots={seasonShots} />
                  </div>
                </>
              )}
            </>
          ) : (
            <p className="text-sm text-white/40">
              Statistiques de performance non trouvées pour ce joueur.
            </p>
          )}

          {data.advancedStats && (
            <div>
              <h3 className="font-display text-sm font-semibold text-white/70">
                Statistiques avancées <span className="font-normal text-white/40">(duels, dribbles, discipline)</span>
              </h3>
              <p className="mt-0.5 text-xs text-white/30">
                Saison {data.advancedStats.season}/{String(data.advancedStats.season + 1).slice(2)} — dernière disponible via cette source gratuite.
              </p>
              <div className="mt-2 flex flex-col gap-2">
                {data.advancedStats.competitions.map((s, idx) => (
                  <AdvancedStatsCard key={idx} stats={s} />
                ))}
              </div>
            </div>
          )}

          {data.transfers?.length > 0 && (
            <div>
              <h3 className="mb-2 font-display text-sm font-semibold text-white/70">Historique des transferts</h3>
              <ul className="flex flex-col gap-1.5 text-sm">
                {data.transfers.slice(0, 8).map((t, idx) => (
                  <li key={idx} className="flex flex-col gap-1 border-b border-white/5 py-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                    <span className="min-w-0 truncate text-white/60">
                      {t.clubFrom?.name || '—'} → {t.clubTo?.name}
                    </span>
                    <span className="flex shrink-0 items-center gap-2 text-xs text-white/40">
                      {formatFullDate(t.date)}
                      <span className="stat-value text-accent">
                        {t.fee != null ? formatMarketValue(t.fee) : ''}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
