import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { getReliabilityBadge, formatRelativeTime } from '../../domain/formatters'

export function NewsCard({ article }) {
  const reliability = getReliabilityBadge(article.sourceTier)

  return (
    <Card>
      <div className="flex items-center justify-between text-xs text-white/40">
        <span>{article.source}</span>
        <span>{formatRelativeTime(article.publishedAt)}</span>
      </div>
      <h3 className="mt-2 font-display text-base font-semibold">{article.title}</h3>
      {article.summary && <p className="mt-2 text-sm text-white/60 line-clamp-3">{article.summary}</p>}
      <div className="mt-4 flex items-center justify-between">
        {reliability ? <Badge color={reliability.color}>{reliability.label}</Badge> : <span />}
        <a
          href={article.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-current transition-colors duration-150 hover:bg-white/10"
        >
          Lire l'article complet ↗
        </a>
      </div>
    </Card>
  )
}
