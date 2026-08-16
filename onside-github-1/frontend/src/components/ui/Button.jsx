import { classNames } from '../../domain/formatters'

const VARIANTS = {
  primary: 'bg-accent text-[#04140F] hover:bg-accent-active',
  ghost: 'bg-white/5 text-current hover:bg-white/10 border border-white/10',
  danger: 'bg-danger/15 text-danger hover:bg-danger/25 border border-danger/30',
}

export function Button({ variant = 'ghost', className, children, ...props }) {
  return (
    <button
      className={classNames(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed',
        VARIANTS[variant] || VARIANTS.ghost,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
