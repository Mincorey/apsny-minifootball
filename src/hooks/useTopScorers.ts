import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { TopScorer } from '../types/database'

export function useTopScorers(leagueId: string | null, limit = 20) {
  const [scorers, setScorers] = useState<TopScorer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!leagueId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('top_scorers')
      .select('*')
      .eq('league_id', leagueId)
      .gt('total_goals', 0)
      .order('total_goals', { ascending: false })
      .limit(limit)

    if (error) {
      setError(error.message)
    } else {
      setScorers(data ?? [])
      setError(null)
    }
    setLoading(false)
  }, [leagueId, limit])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { scorers, loading, error, refetch }
}
