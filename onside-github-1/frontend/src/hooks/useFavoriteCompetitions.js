import { useEffect, useState } from 'react'
import { api, endpoints } from '../lib/api'
import { useFavoritesContext } from './FavoritesContext'

export function useFavoriteCompetitions() {
  const { favorites } = useFavoritesContext()
  const [competitions, setCompetitions] = useState([])
  const favoriteId = favorites[0]?.id

  useEffect(() => {
    if (!favoriteId) {
      setCompetitions([])
      return
    }
    api.get(endpoints.favoriteCompetitions(favoriteId)).then(setCompetitions).catch(() => setCompetitions([]))
  }, [favoriteId])

  return competitions
}
