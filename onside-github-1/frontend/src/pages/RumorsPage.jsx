import { useApi } from '../hooks/useApi'
import { useFavoritesContext } from '../hooks/FavoritesContext'
import { api, endpoints } from '../lib/api'
import { RumorCard } from '../components/news/RumorCard'
import { LoadingState } from '../components/ui/LoadingState'
import { ErrorState } from '../components/ui/ErrorState'
import { Card } from '../components/ui/Card'
import { ApiNotice } from '../components/ui/ApiNotice'
import { mentionsClub } from '../domain/clubMatch'

export function RumorsPage() {
  const { onlyFavorites, favorites } = useFavoritesContext()
  const favoriteName = favorites[0]?.name
  const { data, loading, error } = useApi(() => api.get(endpoints.rumors()), [])
  const rumors = Array.isArray(data) ? data : data?.rumors || []
  const filtered = onlyFavorites && favoriteName ? rumors.filter((r) => mentionsClub(r, favoriteName)) : rumors
  const sorted = [...filtered].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Rumeurs</h1>
        <ApiNotice>Flux externes, parfois temporairement indisponibles.</ApiNotice>
      </div>

      {onlyFavorites && !favoriteName && (
        <Card className="text-center text-sm text-white/40">Ajoute un club favori pour filtrer.</Card>
      )}
      {loading && <LoadingState label="Chargement des rumeurs…" />}
      {error && <ErrorState label="Rumeurs indisponibles pour le moment." />}
      {!loading && !error && (!onlyFavorites || favoriteName) && (
        <div className="stagger-list flex flex-col gap-3">
          {sorted.map((rumor) => (
            <RumorCard key={rumor.link} rumor={rumor} />
          ))}
          {sorted.length === 0 && (
            <Card className="text-center text-sm text-white/40">Aucune rumeur pour le moment.</Card>
          )}
        </div>
      )}
    </div>
  )
}
