import { useEffect, useState } from 'react'
import { useApi } from '../hooks/useApi'
import { useFavoritesContext } from '../hooks/FavoritesContext'
import { useFavoriteCompetitions } from '../hooks/useFavoriteCompetitions'
import { api, endpoints } from '../lib/api'
import { DEFAULT_COMPETITIONS } from '../domain/competitions'
import { CompetitionSelector } from '../components/ui/CompetitionSelector'
import { SeasonSelector } from '../components/ui/SeasonSelector'
import { StandingsTable } from '../components/scores/StandingsTable'
import { LoadingState } from '../components/ui/LoadingState'
import { ErrorState } from '../components/ui/ErrorState'
import { Card } from '../components/ui/Card'
import { ApiNotice } from '../components/ui/ApiNotice'

function extractRows(data) {
  return Array.isArray(data) ? data : data?.standings?.find((s) => s.type === 'TOTAL')?.table || data?.standings?.[0]?.table
}

function useFavoriteStandings(competitions, season) {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const codes = competitions.map((c) => c.code).join(',')

  useEffect(() => {
    if (!codes) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    Promise.all(
      competitions.map((c) =>
        api
          .get(endpoints.standings(c.code, season))
          .then((data) => ({ competition: c, rows: extractRows(data) || [] }))
          .catch(() => ({ competition: c, rows: [] })),
      ),
    )
      .then(setResults)
      .catch(() => setError(new Error('failed')))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codes, season])

  return { results, loading, error }
}

export function StandingsPage() {
  const [competition, setCompetition] = useState(DEFAULT_COMPETITIONS[0].code)
  const [season, setSeason] = useState('')
  const { isFavorite, onlyFavorites, favorites } = useFavoritesContext()
  const favoriteCompetitions = useFavoriteCompetitions()
  const hasFavorite = !!favorites[0]
  const useMulti = onlyFavorites && hasFavorite

  const singleCompetition = useApi(
    () => api.get(endpoints.standings(competition, season)),
    [competition, season],
  )
  const favoriteStandings = useFavoriteStandings(useMulti ? favoriteCompetitions : [], season)

  const loading = useMulti ? favoriteStandings.loading : singleCompetition.loading
  const error = useMulti ? favoriteStandings.error : singleCompetition.error
  const rows = useMulti ? null : extractRows(singleCompetition.data)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Classements</h1>
        <div className="mt-4 flex flex-col gap-3">
          {!useMulti && (
            <CompetitionSelector competitions={DEFAULT_COMPETITIONS} value={competition} onChange={setCompetition} />
          )}
          <SeasonSelector value={season} onChange={setSeason} />
        </div>
        <ApiNotice>Données fournies par une API externe gratuite, parfois temporairement indisponible.</ApiNotice>
      </div>

      {onlyFavorites && !hasFavorite && (
        <Card className="text-center text-sm text-white/40">Ajoute un club favori pour filtrer.</Card>
      )}

      {loading && <LoadingState label="Chargement du classement…" />}
      {error && <ErrorState label="Classement indisponible pour cette compétition." />}

      {!loading && !error && useMulti && (
        <div className="flex flex-col gap-8">
          {favoriteStandings.results?.map(({ competition: comp, rows: compRows }) => (
            <section key={comp.code}>
              <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
                {comp.name}
              </h2>
              {compRows.length > 0 ? (
                <StandingsTable rows={compRows} isFavorite={isFavorite} />
              ) : (
                <Card className="text-center text-sm text-white/40">Aucune donnée de classement.</Card>
              )}
            </section>
          ))}
        </div>
      )}

      {!loading && !error && !useMulti && rows?.length > 0 && <StandingsTable rows={rows} isFavorite={isFavorite} />}
      {!loading && !error && !useMulti && rows?.length === 0 && <ErrorState label="Aucune donnée de classement." />}
    </div>
  )
}
