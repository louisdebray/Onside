import { useCallback, useState } from 'react'
import { api, endpoints } from '../lib/api'

const STORAGE_KEY = 'onside:favoriteClub'

function readStoredFavorite() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? [JSON.parse(raw)] : []
  } catch {
    return []
  }
}

// Le club favori est propre à chaque navigateur/appareil (localStorage), pas partagé
// entre les ~15 utilisateurs. Le backend est quand même informé (POST) pour qu'il
// mette en cache les données Transfermarkt de ce club, mais il ne garde jamais une
// seule "vérité" globale : chaque appareil garde son propre choix.
export function useFavorites() {
  const [favorites, setFavorites] = useState(readStoredFavorite)
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const loading = false

  const toggleFavorite = useCallback(async (club) => {
    const current = favorites[0]
    const isRemoving = current && String(current.id) === String(club.id)

    if (isRemoving) {
      localStorage.removeItem(STORAGE_KEY)
      setFavorites([])
      return
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(club))
    setFavorites([club])
    try {
      await api.post(endpoints.favorites(), { id: club.id, name: club.name })
    } catch {
      // Le backend garde ça pour la mise en cache Transfermarkt ; un échec réseau
      // ne doit pas empêcher ce navigateur d'avoir son favori localement.
    }
  }, [favorites])

  const isFavorite = useCallback(
    (clubId) => clubId != null && favorites.some((c) => String(c.id) === String(clubId)),
    [favorites],
  )

  return { favorites, loading, toggleFavorite, isFavorite, onlyFavorites, setOnlyFavorites }
}
