import { useState } from 'react'
import { useApi } from '../hooks/useApi'
import { useFavoritesContext } from '../hooks/FavoritesContext'
import { useFavoriteCompetitions } from '../hooks/useFavoriteCompetitions'
import { useFavoriteMatches } from '../hooks/useFavoriteMatches'
import { api, endpoints } from '../lib/api'
import { DEFAULT_COMPETITIONS } from '../domain/competitions'
import { CompetitionSelector } from '../components/ui/CompetitionSelector'
import { SeasonSelector } from '../components/ui/SeasonSelector'
import { MatchCard } from '../components/scores/MatchCard'
import { LoadingState } from '../components/ui/LoadingState'
import { ErrorState } from '../components/ui/ErrorState'
import { Card } from '../components/ui/Card'
import { ApiNotice } from '../components/ui/ApiNotice'
import { groupByMonth, monthLabel } from '../domain/formatters'

export function ScoresPage() {
  const [competition, setCompetition] = useState(DEFAULT_COMPETITIONS[0].code)
  const [season, setSeason] = useState('')
  const { isFavorite, onlyFavorites, favorites } = useFavoritesContext()
  const favoriteCompetitions = useFavoriteCompetitions()
  const hasFavorite = !!favorites[0]

  const singleCompetition = useApi(
    () => api.get(endpoints.matches(competition, season)),
    [competition, season],
  )
  const favoriteMatches = useFavoriteMatches(onlyFavorites && hasFavorite ? favoriteCompetitions : [], season)

  const useMulti = onlyFavorites && hasFavorite
  const loading = useMulti ? favoriteMatches.loading : singleCompetition.loading
  const error = useMulti ? favoriteMatches.error : singleCompetition.error

  let matches
  if (useMulti) {
    matches = favoriteMatches.matches
  } else {
    const data = singleCompetition.data
    matches = Array.isArray(data) ? data : data?.matches
  }

  const finished = matches?.filter((m) => m.status === 'FINISHED')
  const filtered = onlyFavorites
    ? finished?.filter((m) => isFavorite(m.homeTeam?.id) || isFavorite(m.awayTeam?.id))
    : finished

  const groups = groupByMonth(filtered || [], (m) => m.utcDate)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Scores</h1>
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
      {(!onlyFavorites || hasFavorite) && (
        <>
          {loading && <LoadingState label="Chargement des scores…" />}
          {error && <ErrorState label="Scores indisponibles pour cette compétition." />}
          {!loading && !error && (
            <div className="flex flex-col gap-8">
              {groups.map(([key, monthMatches]) => (
                <section key={key}>
                  <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-white/50">
                    {monthLabel(monthMatches[0].utcDate)}
                  </h2>
                  <div className="stagger-list mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {monthMatches.map((match) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        showStats
                        isFavorite={isFavorite(match.homeTeam?.id) || isFavorite(match.awayTeam?.id)}
                      />
                    ))}
                  </div>
                </section>
              ))}
              {filtered?.length === 0 && (
                <Card className="text-center text-sm text-white/40">Aucun match terminé pour cette sélection.</Card>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
