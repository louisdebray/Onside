import { useEffect, useState } from 'react'
import { api, endpoints } from '../lib/api'

export function useFavoriteFixtures(competitions) {
  const [fixtures, setFixtures] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const codes = competitions.map((c) => c.code).join(',')

  useEffect(() => {
    if (!codes) {
      setFixtures([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    Promise.all(
      competitions.map((c) =>
        api
          .get(endpoints.fixtures(c.code))
          .then((data) => (Array.isArray(data) ? data : data?.matches) || [])
          .catch(() => []),
      ),
    )
      .then((lists) => setFixtures(lists.flat()))
      .catch(() => setError(new Error('failed')))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codes])

  return { fixtures, loading, error }
}
