import { useEffect, useState } from 'react'
import { api, endpoints } from '../lib/api'

function currentSeasonYear() {
  const now = new Date()
  return now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1
}

// Fetches finished matches for a set of competitions, across the current and
// previous season, since a competition's "current" season may have zero
// finished matches yet (preseason) while another's still resolves to last
// season's data — merging both keeps "recent results" meaningful year-round.
export function useRecentMatches(competitions) {
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
    const seasons = ['', String(currentSeasonYear() - 1)]
    Promise.all(
      competitions.flatMap((c) =>
        seasons.map((season) =>
          api
            .get(endpoints.matches(c.code, season))
            .then((data) => (Array.isArray(data) ? data : data?.matches) || [])
            .catch(() => []),
        ),
      ),
    )
      .then((lists) => {
        const byId = new Map()
        for (const m of lists.flat()) byId.set(m.id, m)
        setMatches([...byId.values()])
      })
      .catch(() => setError(new Error('failed')))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codes])

  return { matches, loading, error }
}
