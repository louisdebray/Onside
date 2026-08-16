import { useEffect, useState } from 'react'

// Sur Render (hébergement gratuit du backend), le serveur s'endort après 15 min
// d'inactivité et met ~30-50s à se réveiller au prochain appel. Sans ce message, un
// chargement anormalement long ressemble à une panne et pousse à quitter l'app —
// on rassure donc l'utilisateur dès qu'un chargement traîne, sans savoir précisément
// si c'est un réveil serveur ou juste une connexion lente.
const WAKE_UP_DELAY_MS = 4000

export function LoadingState({ label = 'Chargement…' }) {
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), WAKE_UP_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="flex items-center justify-center gap-3 py-10 text-center text-white/50">
      <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
      <span className="text-sm">
        {slow ? "Le serveur se réveille après une pause, ça peut prendre jusqu'à 50 secondes…" : label}
      </span>
    </div>
  )
}
