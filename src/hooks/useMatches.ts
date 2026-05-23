import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Match, MatchWithTeams } from '../types/database'

/** Все матчи лиги */
export function useMatches(leagueId: string | null) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!leagueId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('league_id', leagueId)
      .order('tour', { ascending: true })

    if (error) {
      setError(error.message)
    } else {
      setMatches(data ?? [])
      setError(null)
    }
    setLoading(false)
  }, [leagueId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { matches, loading, error, refetch }
}

/** Сыгранные матчи лиги */
export function usePlayedMatches(leagueId: string | null) {
  const { matches, ...rest } = useMatches(leagueId)
  return { matches: matches.filter(m => m.status === 'played'), ...rest }
}

/** Запланированные матчи лиги */
export function useScheduledMatches(leagueId: string | null) {
  const { matches, ...rest } = useMatches(leagueId)
  return {
    matches: matches
      .filter(m => m.status === 'scheduled')
      .sort((a, b) => {
        if (!a.scheduled_at) return 1
        if (!b.scheduled_at) return -1
        return a.scheduled_at.localeCompare(b.scheduled_at)
      }),
    ...rest,
  }
}

/** Матчи с данными команд (join) */
export function useMatchesWithTeams(leagueId: string | null) {
  const [matches, setMatches] = useState<MatchWithTeams[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!leagueId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('matches')
      .select('*, team_a:teams!team_a_id(*), team_b:teams!team_b_id(*), stats:match_player_stats(*)')
      .eq('league_id', leagueId)
      .order('tour', { ascending: true })

    if (error) {
      setError(error.message)
    } else {
      setMatches((data as unknown as MatchWithTeams[]) ?? [])
      setError(null)
    }
    setLoading(false)
  }, [leagueId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { matches, loading, error, refetch }
}
