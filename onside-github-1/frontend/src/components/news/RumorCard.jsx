import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { formatRelativeTime } from '../../domain/formatters'

export function RumorCard({ rumor }) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <Badge color="accent">{rumor.source}</Badge>
        <span className="text-xs text-white/40">{formatRelativeTime(rumor.publishedAt)}</span>
      </div>
      <p className="mt-2 font-display text-sm font-semibold leading-snug">{rumor.title}</p>
      {rumor.summary && <p className="mt-2 text-sm leading-relaxed text-white/60">{rumor.summary}</p>}
      {rumor.link && (
        <a
          href={rumor.link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-xs text-accent hover:underline"
        >
          Voir la source ↗
        </a>
      )}
    </Card>
  )
}
