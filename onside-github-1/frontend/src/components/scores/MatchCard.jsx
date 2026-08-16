import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { FlashValue } from '../ui/FlashValue'
import { formatMatchDate, formatScore, classNames } from '../../domain/formatters'

export function MatchCard({ match, isFavorite, showStats, onClick }) {
  const halfTime = match.score?.halfTime
  return (
    <Card
      className={classNames(isFavorite && 'border border-accent/30', onClick && 'cursor-pointer hover:border-white/20')}
      onClick={onClick}
    >
      <div className="flex items-center justify-between text-xs text-white/40">
        <span>{match.competition?.name}</span>
        <span>{formatMatchDate(match.utcDate)}</span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="flex-1 truncate text-sm font-medium">{match.homeTeam?.name}</span>
        <FlashValue
          value={formatScore(match.score?.fullTime?.home, match.score?.fullTime?.away)}
          className="stat-value shrink-0 text-base font-semibold text-accent"
        />
        <span className="flex-1 truncate text-right text-sm font-medium">{match.awayTeam?.name}</span>
      </div>
      {showStats && (
        <div className="mt-3 flex items-center justify-center gap-4 text-xs text-white/40">
          {match.matchday != null && <span>Journée {match.matchday}</span>}
          {halfTime?.home != null && halfTime?.away != null && (
            <span className="stat-value">Mi-temps {formatScore(halfTime.home, halfTime.away)}</span>
          )}
        </div>
      )}
      {isFavorite && (
        <div className="mt-2 flex justify-center">
          <Badge color="accent">★ Favori</Badge>
        </div>
      )}
    </Card>
  )
}
