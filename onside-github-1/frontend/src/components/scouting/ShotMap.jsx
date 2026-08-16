export function ShotMap({ shots }) {
  if (!shots.length) return <p className="text-sm text-white/40">Aucun tir enregistré pour cette saison.</p>

  return (
    <svg viewBox="0 0 100 65" className="w-full rounded-lg" style={{ background: 'rgba(16,232,160,0.04)' }}>
      <rect x="0.5" y="0.5" width="99" height="64" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.4" />
      <line x1="50" y1="0.5" x2="50" y2="64.5" stroke="rgba(255,255,255,0.1)" strokeWidth="0.3" />
      <circle cx="50" cy="32.5" r="8" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.3" />
      <rect x="83.5" y="20.5" width="16" height="24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.4" />
      {shots.map((shot, idx) => {
        const x = Number(shot.X) * 100
        const y = Number(shot.Y) * 65
        const isGoal = shot.result === 'Goal'
        return (
          <circle
            key={idx}
            cx={x}
            cy={y}
            r={isGoal ? 1.4 : 0.9}
            fill={isGoal ? '#10E8A0' : 'rgba(255,255,255,0.35)'}
            stroke={isGoal ? '#00B589' : 'none'}
            strokeWidth="0.3"
          />
        )
      })}
    </svg>
  )
}
