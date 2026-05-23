import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Season } from '../types/database'

export function useSeasons() {
  const [seasons, setSeasons] = useState<Season[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('seasons')
      .select('*')
      .order('year', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setSeasons(data ?? [])
      setError(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    let cancelled = false

    refetch().then(() => {
      if (!cancelled) {
        // успешно загружено
      }
    })

    return () => { cancelled = true }
  }, [refetch])

  return { seasons, loading, error, refetch }
}

/** Возвращает первый активный сезон */
export function useActiveSeason() {
  const { seasons, loading, error, refetch } = useSeasons()
  const active = seasons.find(s => s.status === 'active') ?? seasons[0] ?? null
  return { season: active, loading, error, refetch }
}
