export function LoadingState({ label = 'Chargement…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-10 text-white/50">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
      <span className="text-sm">{label}</span>
    </div>
  )
}
