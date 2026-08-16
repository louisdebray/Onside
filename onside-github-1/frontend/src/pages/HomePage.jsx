import { useApi } from '../hooks/useApi'
import { useFavoritesContext } from '../hooks/FavoritesContext'
import { useFavoriteCompetitions } from '../hooks/useFavoriteCompetitions'
import { useRecentMatches } from '../hooks/useRecentMatches'
import { useFavoriteFixtures } from '../hooks/useFavoriteFixtures'
import { api, endpoints } from '../lib/api'
import { DEFAULT_COMPETITIONS } from '../domain/competitions'
import { FocusMatchCard } from '../components/scores/FocusMatchCard'
import { MatchCard } from '../components/scores/MatchCard'
import { NewsCard } from '../components/news/NewsCard'
import { RumorCard } from '../components/news/RumorCard'
import { FavoritesSelector } from '../components/FavoritesSelector'
import { LoadingState } from '../components/ui/LoadingState'
import { ErrorState } from '../components/ui/ErrorState'
import { Card } from '../components/ui/Card'
import { mentionsClub } from '../domain/clubMatch'

const ONE_DAY_MS = 24 * 60 * 60 * 1000

function pickFocusMatch(finishedMatches, upcomingMatches) {
  const lastMatch = [...(finishedMatches || [])].sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate))[0]
  const nextMatch = [...(upcomingMatches || [])].sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))[0]

  if (lastMatch) {
    const daysSince = (Date.now() - new Date(lastMatch.utcDate).getTime()) / ONE_DAY_MS
    if (daysSince <= 1) return lastMatch
  }
  return nextMatch || lastMatch || null
}

function byDateDesc(a, b) {
  return new Date(b.publishedAt) - new Date(a.publishedAt)
}

export function HomePage() {
  const { isFavorite, onlyFavorites, favorites } = useFavoritesContext()
  const favorite = favorites[0]
  const favoriteCompetitions = useFavoriteCompetitions()
  const useFavoriteMode = onlyFavorites && !!favorite

  const recentMatches = useRecentMatches(useFavoriteMode ? favoriteCompetitions : DEFAULT_COMPETITIONS)
  const favFixtures = useFavoriteFixtures(useFavoriteMode ? favoriteCompetitions : [])
  const { data: news, loading: newsLoading, error: newsError } = useApi(() => api.get(endpoints.news()), [])
  const { data: rumors, loading: rumorsLoading, error: rumorsError } = useApi(() => api.get(endpoints.rumors()), [])

  const matchesLoading = useFavoriteMode ? recentMatches.loading || favFixtures.loading : recentMatches.loading
  const matchesError = useFavoriteMode ? recentMatches.error || favFixtures.error : recentMatches.error

  let finishedMatches
  let focusMatch = null
  if (useFavoriteMode) {
    const involvesFavorite = (m) => isFavorite(m.homeTeam?.id) || isFavorite(m.awayTeam?.id)
    const finished = (recentMatches.matches || []).filter((m) => m.status === 'FINISHED' && involvesFavorite(m))
    const upcoming = (favFixtures.fixtures || []).filter(involvesFavorite)
    finishedMatches = [...finished].sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate))
    focusMatch = pickFocusMatch(finished, upcoming)
  } else {
    finishedMatches = (recentMatches.matches || [])
      .filter((m) => m.status === 'FINISHED')
      .sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate))
  }

  const newsList = (useFavoriteMode ? (news || []).filter((a) => mentionsClub(a, favorite.name)) : news || []).slice().sort(byDateDesc)
  const rumorsList = (useFavoriteMode ? (rumors || []).filter((r) => mentionsClub(r, favorite.name)) : rumors || []).slice().sort(byDateDesc)
  const newsCount = useFavoriteMode ? 4 : 3

  return (
    <div className="flex flex-col gap-8">
      {useFavoriteMode && (
        <>
          {matchesLoading && <LoadingState label="Chargement du match du jour…" />}
          {matchesError && <ErrorState label="Impossible de charger le match à la une." />}
          {focusMatch && <FocusMatchCard match={focusMatch} />}
        </>
      )}

      <FavoritesSelector />

      <section>
        <h2 className="font-display text-lg font-semibold">Derniers scores</h2>
        {matchesLoading && <LoadingState />}
        {matchesError && <ErrorState />}
        {!matchesLoading && !matchesError && (
          <div className="stagger-list mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {finishedMatches.slice(0, 5).map((match) => (
              <MatchCard key={match.id} match={match} showStats isFavorite={isFavorite(match.homeTeam?.id) || isFavorite(match.awayTeam?.id)} />
            ))}
            {finishedMatches.length === 0 && (
              <Card className="col-span-full text-center text-sm text-white/40">
                {useFavoriteMode ? 'Aucun match terminé pour votre club favori.' : 'Aucun match terminé.'}
              </Card>
            )}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section>
          <h2 className="font-display text-lg font-semibold">Actualité</h2>
          {newsLoading && <LoadingState />}
          {newsError && <ErrorState label="Actualité indisponible." />}
          <div className="stagger-list mt-4 flex flex-col gap-3">
            {newsList.slice(0, newsCount).map((article) => (
              <NewsCard key={article.link} article={article} />
            ))}
            {newsList.length === 0 && !newsLoading && (
              <p className="text-sm text-white/40">Aucune actualité pour le moment.</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold">Dernières rumeurs</h2>
          {rumorsLoading && <LoadingState />}
          {rumorsError && <ErrorState label="Rumeurs indisponibles." />}
          <div className="stagger-list mt-4 flex flex-col gap-3">
            {rumorsList.slice(0, 4).map((rumor) => (
              <RumorCard key={rumor.link} rumor={rumor} />
            ))}
            {rumorsList.length === 0 && !rumorsLoading && (
              <p className="text-sm text-white/40">Aucune rumeur pour le moment.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
