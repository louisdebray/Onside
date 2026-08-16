export function PlayerStatsTable({ seasons }) {
  return (
    <div className="overflow-x-auto rounded-2xl glass-secondary">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-white/40">
            <th className="px-4 py-3">Saison</th>
            <th className="px-4 py-3">Compétition</th>
            <th className="px-3 py-3 text-center">Matchs</th>
            <th className="px-3 py-3 text-center">Buts</th>
            <th className="px-3 py-3 text-center">Passes D.</th>
          </tr>
        </thead>
        <tbody>
          {seasons.map((row, idx) => (
            <tr key={idx} className="border-b border-white/5 last:border-0">
              <td className="px-4 py-2.5 stat-value">{row.season}</td>
              <td className="px-4 py-2.5">{row.competition}</td>
              <td className="px-3 py-2.5 text-center stat-value">{row.appearances}</td>
              <td className="px-3 py-2.5 text-center stat-value text-accent">{row.goals}</td>
              <td className="px-3 py-2.5 text-center stat-value">{row.assists}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
