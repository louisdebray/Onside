export function ErrorState({ label = 'Donnée indisponible pour le moment.' }) {
  return (
    <div className="flex flex-col items-center gap-1 py-10 text-center text-white/40">
      <span className="text-2xl">⚠</span>
      <span className="text-sm">{label}</span>
    </div>
  )
}
