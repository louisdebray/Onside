import { Card } from '../ui/Card'
import { formatMarketValue } from '../../domain/formatters'

export function PlayerHeader({ player }) {
  return (
    <Card variant="primary">
      <div className="flex items-center gap-5">
        <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-white/10 text-3xl">
          {player.photo ? (
            <img src={player.photo} alt={player.name} className="h-full w-full rounded-full object-cover" />
          ) : (
            '👤'
          )}
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">{player.name}</h1>
          <p className="text-sm text-white/50">{player.position} · {player.club} · {player.nationality}</p>
          <p className="stat-value mt-2 text-xl font-semibold text-accent">
            {formatMarketValue(player.marketValue)}
          </p>
        </div>
      </div>
    </Card>
  )
}
