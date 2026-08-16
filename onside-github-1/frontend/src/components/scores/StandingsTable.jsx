import { classNames } from '../../domain/formatters'

const STICKY_BG = '#0F141C'

export function StandingsTable({ rows, isFavorite }) {
  return (
    <div className="overflow-x-auto rounded-2xl glass-secondary">
      <table className="w-full min-w-[440px] table-fixed border-collapse text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-white/40">
            <th className="sticky left-0 z-10 w-8 px-2 py-3" style={{ background: STICKY_BG }}>
              #
            </th>
            <th className="sticky left-8 z-10 w-32 px-2 py-3" style={{ background: STICKY_BG }}>
              Club
            </th>
            <th className="w-10 px-2 py-3 text-center">J</th>
            <th className="w-12 px-2 py-3 text-center font-bold">Pts</th>
            <th className="w-10 px-2 py-3 text-center">G</th>
            <th className="w-10 px-2 py-3 text-center">N</th>
            <th className="w-10 px-2 py-3 text-center">P</th>
            <th className="w-12 px-2 py-3 text-center">+/-</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const rowBg = isFavorite?.(row.team?.id) ? 'rgba(16,232,160,0.08)' : STICKY_BG
            return (
              <tr
                key={row.team?.id || row.position}
                className={classNames(
                  'border-b border-white/5 last:border-0',
                  isFavorite?.(row.team?.id) && 'bg-accent/8',
                )}
              >
                <td className="sticky left-0 z-10 px-2 py-2.5 text-white/50" style={{ background: rowBg }}>
                  {row.position}
                </td>
                <td className="sticky left-8 z-10 truncate px-2 py-2.5 font-medium" style={{ background: rowBg }}>
                  {row.team?.name}
                </td>
                <td className="px-2 py-2.5 text-center stat-value">{row.playedGames}</td>
                <td className="px-2 py-2.5 text-center stat-value font-bold text-accent">{row.points}</td>
                <td className="px-2 py-2.5 text-center stat-value">{row.won}</td>
                <td className="px-2 py-2.5 text-center stat-value">{row.draw}</td>
                <td className="px-2 py-2.5 text-center stat-value">{row.lost}</td>
                <td className="px-2 py-2.5 text-center stat-value">{row.goalDifference}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
