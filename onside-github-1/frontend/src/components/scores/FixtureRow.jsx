import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { formatFullDate, formatTime } from '../../domain/formatters'

export function FixtureRow({ fixture, isFavorite }) {
  return (
    <Card className={isFavorite ? 'border border-accent/30' : undefined}>
      <div className="flex items-center justify-between gap-3">
        <span className="flex-1 truncate text-sm font-medium">{fixture.homeTeam?.name}</span>
        <span className="stat-value shrink-0 text-xs text-white/40">vs</span>
        <span className="flex-1 truncate text-right text-sm font-medium">{fixture.awayTeam?.name}</span>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-white/40">
        <span>{fixture.competition?.name}</span>
        <span className="stat-value">
          {formatFullDate(fixture.utcDate)} · {formatTime(fixture.utcDate)}
        </span>
      </div>
      {fixture.venue && <div className="mt-1 text-xs text-white/40">📍 {fixture.venue}</div>}
      {isFavorite && (
        <div className="mt-2 flex justify-center">
          <Badge color="accent">★ Favori</Badge>
        </div>
      )}
    </Card>
  )
}
