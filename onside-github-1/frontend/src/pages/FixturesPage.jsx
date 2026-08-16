import { useState } from 'react'
import { useApi } from '../hooks/useApi'
import { useFavoritesContext } from '../hooks/FavoritesContext'
import { useFavoriteCompetitions } from '../hooks/useFavoriteCompetitions'
import { useFavoriteFixtures } from '../hooks/useFavoriteFixtures'
import { api, endpoints } from '../lib/api'
import { DEFAULT_COMPETITIONS } from '../domain/competitions'
import { CompetitionSelector } from '../components/ui/CompetitionSelector'
import { FixtureRow } from '../components/scores/FixtureRow'
import { LoadingState } from '../components/ui/LoadingState'
import { ErrorState } from '../components/ui/ErrorState'
import { Card } from '../components/ui/Card'
import { ApiNotice } from '../components/ui/ApiNotice'

export function FixturesPage() {
  const [competition, setCompetition] = useState(DEFAULT_COMPETITIONS[0].code)
  const { isFavorite, onlyFavorites, favorites } = useFavoritesContext()
  const favoriteCompetitions = useFavoriteCompetitions()
  const hasFavorite = !!favorites[0]
  const useMulti = onlyFavorites && hasFavorite

  const singleCompetition = useApi(() => api.get(endpoints.fixtures(competition)), [competition])
  const favoriteFixtures = useFavoriteFixtures(useMulti ? favoriteCompetitions : [])

  const loading = useMulti ? favoriteFixtures.loading : singleCompetition.loading
  const error = useMulti ? favoriteFixtures.error : singleCompetition.error

  let fixtures
  if (useMulti) {
    fixtures = favoriteFixtures.fixtures
  } else {
    const data = singleCompetition.data
    fixtures = Array.isArray(data) ? data : data?.matches
  }

  const filtered = onlyFavorites
    ? fixtures?.filter((f) => isFavorite(f.homeTeam?.id) || isFavorite(f.awayTeam?.id))
    : fixtures

  const sorted = [...(filtered || [])].sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Calendrier</h1>
        <div className="mt-4">
          {!useMulti && (
            <CompetitionSelector competitions={DEFAULT_COMPETITIONS} value={competition} onChange={setCompetition} />
          )}
        </div>
        <ApiNotice>Données fournies par une API externe gratuite, parfois temporairement indisponible.</ApiNotice>
      </div>

      {onlyFavorites && !hasFavorite && (
        <Card className="text-center text-sm text-white/40">Ajoute un club favori pour filtrer.</Card>
      )}
      {(!onlyFavorites || hasFavorite) && (
        <>
          {loading && <LoadingState label="Chargement du calendrier…" />}
          {error && <ErrorState label="Calendrier indisponible pour cette compétition." />}
          {!loading && !error && (
            <div className="stagger-list grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sorted.map((fixture) => (
                <FixtureRow
                  key={fixture.id}
                  fixture={fixture}
                  isFavorite={isFavorite(fixture.homeTeam?.id) || isFavorite(fixture.awayTeam?.id)}
                />
              ))}
              {sorted.length === 0 && (
                <Card className="col-span-full text-center text-sm text-white/40">Aucun match à venir.</Card>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
