import { useEffect, useState } from 'react'
import { api, endpoints } from '../lib/api'

export function useFavoriteMatches(competitions, season) {
  const [matches, setMatches] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const codes = competitions.map((c) => c.code).join(',')

  useEffect(() => {
    if (!codes) {
      setMatches([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    Promise.all(
      competitions.map((c) =>
        api
          .get(endpoints.matches(c.code, season))
          .then((data) => (Array.isArray(data) ? data : data?.matches) || [])
          .catch(() => []),
      ),
    )
      .then((lists) => setMatches(lists.flat()))
      .catch(() => setError(new Error('failed')))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codes, season])

  return { matches, loading, error }
}
