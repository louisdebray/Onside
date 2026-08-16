import { useState } from 'react'
import { useApi } from '../hooks/useApi'
import { useFavoritesContext } from '../hooks/FavoritesContext'
import { api, endpoints } from '../lib/api'
import { LoadingState } from '../components/ui/LoadingState'
import { ErrorState } from '../components/ui/ErrorState'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { ApiNotice } from '../components/ui/ApiNotice'
import { formatMarketValue, formatFullDate, formatSeason } from '../domain/formatters'

function RecentTransferRow({ transfer }) {
  return (
    <Card>
      <p className="font-display text-sm font-semibold">{transfer.player}</p>
      <p className="mt-1 text-xs text-white/50">
        {transfer.from || 'Inconnu'} → {transfer.to}
      </p>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-white/40">
          {transfer.season ? formatSeason(transfer.season) : transfer.date ? formatFullDate(transfer.date) : transfer.position || ''}
        </span>
        <span className="stat-value font-semibold text-accent">
          {transfer.fee != null ? formatMarketValue(transfer.fee) : 'Montant non communiqué'}
        </span>
      </div>
    </Card>
  )
}

function RecordRow({ row }) {
  return (
    <li className="flex items-center gap-3 border-b border-white/5 py-3 text-sm last:border-0">
      <span className="w-6 shrink-0 text-white/40">{row.rank}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{row.player}</p>
        <p className="truncate text-xs text-white/40">
          {row.club} · {row.season}
        </p>
      </div>
      <span className="stat-value shrink-0 font-semibold text-accent">{formatMarketValue(row.fee)}</span>
    </li>
  )
}

const TABS = [
  { key: 'general', label: 'Derniers transferts (général)' },
  { key: 'recent', label: 'Derniers transferts (mon club favori)' },
  { key: 'favorites-top', label: 'Plus chers (mon club favori)' },
  { key: 'window', label: 'Plus chers du mercato' },
  { key: 'alltime', label: "Plus chers de l'histoire" },
]

export function TransfersPage() {
  const [tab, setTab] = useState('general')
  const { favorites } = useFavoritesContext()
  const favoriteId = favorites[0]?.id
  const { data: general, loading: generalLoading, error: generalError } = useApi(
    () => api.get(endpoints.latestTransfers()),
    [],
  )
  const { data, loading, error } = useApi(() => api.get(endpoints.transfers(favoriteId)), [favoriteId])
  const { data: windowRecords, loading: windowLoading } = useApi(
    () => api.get(endpoints.transferRecords('window')),
    [],
  )
  const { data: allTimeRecords, loading: allTimeLoading } = useApi(
    () => api.get(endpoints.transferRecords('alltime')),
    [],
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Transferts</h1>
        <ApiNotice>Données fournies par une API externe gratuite, parfois temporairement indisponible.</ApiNotice>
      </div>

      <select
        value={tab}
        onChange={(e) => setTab(e.target.value)}
        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 outline-none focus:border-accent"
      >
        {TABS.map((t) => (
          <option key={t.key} value={t.key} className="bg-[#0A0E14]">
            {t.label}
          </option>
        ))}
      </select>

      {tab === 'general' && (
        <>
          {generalLoading && <LoadingState label="Chargement des transferts…" />}
          {generalError && <ErrorState label="Derniers transferts indisponibles pour le moment." />}
          {!generalLoading && !generalError && (
            <div className="stagger-list grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(general || []).map((t, idx) => (
                <RecentTransferRow key={`${t.player}-${idx}`} transfer={t} />
              ))}
            </div>
          )}
        </>
      )}

      {(tab === 'recent' || tab === 'favorites-top') && (
        <>
          {loading && <LoadingState label="Chargement des transferts…" />}
          {error && <ErrorState label="Choisissez un club favori pour voir ses transferts." />}
          {!loading && !error && (
            <div className="stagger-list grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(tab === 'recent' ? data?.recentTransfers : data?.mostExpensiveFavorites || [])?.map((t, idx) => (
                <RecentTransferRow key={`${t.playerId}-${idx}`} transfer={t} />
              ))}
              {(tab === 'recent' ? data?.recentTransfers : data?.mostExpensiveFavorites)?.length === 0 && (
                <Card className="col-span-full text-center text-sm text-white/40">Aucune donnée pour le moment.</Card>
              )}
            </div>
          )}
        </>
      )}

      {tab === 'window' && (
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold">Transferts les plus chers de la fenêtre en cours</h2>
            <Badge color="accent">Top mondial</Badge>
          </div>
          {windowLoading && <LoadingState label="Chargement…" />}
          {!windowLoading && (
            <ul>
              {(windowRecords || []).map((row) => (
                <RecordRow key={row.rank} row={row} />
              ))}
              {windowRecords?.length === 0 && (
                <p className="py-3 text-sm text-white/40">
                  Aucun transfert de cette fenêtre n'apparaît encore dans le top mondial.
                </p>
              )}
            </ul>
          )}
        </Card>
      )}

      {tab === 'alltime' && (
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold">Transferts les plus chers de l'histoire</h2>
            <Badge color="accent">Top mondial</Badge>
          </div>
          {allTimeLoading && <LoadingState label="Chargement…" />}
          {!allTimeLoading && (
            <ul>
              {(allTimeRecords || []).map((row) => (
                <RecordRow key={row.rank} row={row} />
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  )
}
