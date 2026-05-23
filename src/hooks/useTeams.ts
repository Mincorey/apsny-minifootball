import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Team, TeamWithPlayers } from '../types/database'

/** Команды лиги (без игроков) */
export function useTeams(leagueId: string | null) {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!leagueId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('league_id', leagueId)
      .order('name', { ascending: true })

    if (error) {
      setError(error.message)
    } else {
      setTeams(data ?? [])
      setError(null)
    }
    setLoading(false)
  }, [leagueId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { teams, loading, error, refetch }
}

/** Команды лиги ВМЕСТЕ с игроками (через join) */
export function useTeamsWithPlayers(leagueId: string | null) {
  const [teams, setTeams] = useState<TeamWithPlayers[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!leagueId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('teams')
      .select('*, players(*)')
      .eq('league_id', leagueId)
      .order('name', { ascending: true })

    if (error) {
      setError(error.message)
    } else {
      setTeams((data as TeamWithPlayers[]) ?? [])
      setError(null)
    }
    setLoading(false)
  }, [leagueId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { teams, loading, error, refetch }
}
