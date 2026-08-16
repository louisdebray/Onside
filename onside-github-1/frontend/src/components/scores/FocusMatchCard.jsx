import { useRef } from 'react'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { FlashValue } from '../ui/FlashValue'
import { formatMatchDate, formatScore } from '../../domain/formatters'

export function FocusMatchCard({ match }) {
  const cardRef = useRef(null)

  const handleMouseMove = (e) => {
    const el = cardRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    el.style.setProperty('--x', `${e.clientX - rect.left}px`)
    el.style.setProperty('--y', `${e.clientY - rect.top}px`)
  }

  if (!match) return null

  const isLive = match.status === 'LIVE' || match.status === 'IN_PLAY'

  return (
    <Card
      variant="primary"
      className="focus-match-card"
      onMouseMove={handleMouseMove}
      ref={cardRef}
    >
      <div className="relative z-10 flex items-center justify-between">
        <Badge color={isLive ? 'danger' : 'neutral'}>
          {isLive ? '● En direct' : match.competition?.name || 'Match du jour'}
        </Badge>
        <span className="text-xs text-white/40">{formatMatchDate(match.utcDate)}</span>
      </div>

      <div className="relative z-10 mt-6 grid grid-cols-3 items-center gap-3 text-center">
        <div className="flex flex-col items-center gap-2">
          <span className="text-3xl">{match.homeTeam?.crest ? '' : '⚽'}</span>
          <span className="font-display text-sm font-medium">{match.homeTeam?.name}</span>
        </div>

        <FlashValue
          as="div"
          value={formatScore(match.score?.fullTime?.home, match.score?.fullTime?.away)}
          className="stat-value text-4xl font-bold tracking-tight text-accent"
        />

        <div className="flex flex-col items-center gap-2">
          <span className="text-3xl">{match.awayTeam?.crest ? '' : '⚽'}</span>
          <span className="font-display text-sm font-medium">{match.awayTeam?.name}</span>
        </div>
      </div>
    </Card>
  )
}
