import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Standing } from '../types/database'

export function useStandings(leagueId: string | null) {
  const [standings, setStandings] = useState<Standing[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!leagueId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('standings')
      .select('*')
      .eq('league_id', leagueId)
      .order('points',    { ascending: false })
      .order('goal_diff', { ascending: false })
      .order('goals_for', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setStandings(data ?? [])
      setError(null)
    }
    setLoading(false)
  }, [leagueId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { standings, loading, error, refetch }
}
