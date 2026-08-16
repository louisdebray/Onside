import { useMemo, useState } from 'react'
import { useApi } from '../hooks/useApi'
import { useFavoritesContext } from '../hooks/FavoritesContext'
import { api, endpoints } from '../lib/api'
import { NewsCard } from '../components/news/NewsCard'
import { LoadingState } from '../components/ui/LoadingState'
import { ErrorState } from '../components/ui/ErrorState'
import { Card } from '../components/ui/Card'
import { ApiNotice } from '../components/ui/ApiNotice'
import { mentionsClub } from '../domain/clubMatch'

export function NewsPage() {
  const { onlyFavorites, favorites } = useFavoritesContext()
  const favoriteName = favorites[0]?.name
  const [source, setSource] = useState('')
  const { data, loading, error } = useApi(() => api.get(endpoints.news()), [])
  const news = Array.isArray(data) ? data : data?.news || []

  const sources = useMemo(() => [...new Set(news.map((a) => a.source).filter(Boolean))].sort(), [news])

  const filtered = news
    .filter((a) => (onlyFavorites && favoriteName ? mentionsClub(a, favoriteName) : true))
    .filter((a) => (source ? a.source === source : true))
  const sorted = [...filtered].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Actualité</h1>
        <ApiNotice>Flux externes, parfois temporairement indisponibles.</ApiNotice>
      </div>

      <Card className="flex flex-wrap gap-3">
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 outline-none focus:border-accent"
        >
          <option value="" className="bg-[#0A0E14]">Toutes sources</option>
          {sources.map((s) => (
            <option key={s} value={s} className="bg-[#0A0E14]">
              {s}
            </option>
          ))}
        </select>
      </Card>

      {onlyFavorites && !favoriteName && (
        <Card className="text-center text-sm text-white/40">Ajoute un club favori pour filtrer.</Card>
      )}
      {loading && <LoadingState label="Chargement de l'actualité…" />}
      {error && <ErrorState label="Actualité indisponible pour le moment." />}
      {!loading && !error && (!onlyFavorites || favoriteName) && (
        <div className="stagger-list grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((article, i) => (
            <NewsCard key={`${article.link}-${i}`} article={article} />
          ))}
          {sorted.length === 0 && (
            <Card className="col-span-full text-center text-sm text-white/40">Aucun article pour le moment.</Card>
          )}
        </div>
      )}
    </div>
  )
}
