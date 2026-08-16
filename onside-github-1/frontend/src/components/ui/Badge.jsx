import { classNames } from '../../domain/formatters'

const COLORS = {
  accent: 'bg-accent/15 text-accent border-accent/30',
  warning: 'bg-warning/15 text-warning border-warning/30',
  danger: 'bg-danger/15 text-danger border-danger/30',
  neutral: 'bg-white/8 text-white/70 border-white/15',
}

export function Badge({ color = 'neutral', children, className }) {
  return (
    <span
      className={classNames(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        COLORS[color] || COLORS.neutral,
        className,
      )}
    >
      {children}
    </span>
  )
}
