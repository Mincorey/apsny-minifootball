import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { League } from '../types/database'

export function useLeagues(seasonId: string | null) {
  const [leagues, setLeagues] = useState<League[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!seasonId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('leagues')
      .select('*')
      .eq('season_id', seasonId)
      .order('sort_order', { ascending: true })

    if (error) {
      setError(error.message)
    } else {
      setLeagues(data ?? [])
      setError(null)
    }
    setLoading(false)
  }, [seasonId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { leagues, loading, error, refetch }
}
