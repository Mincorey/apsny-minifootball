/**
 * DataContext — единый провайдер данных приложения.
 *
 * Заменяет localStorage. Оборачивает <App /> в main.tsx.
 * Все компоненты получают данные через useData() вместо пропсов / useState.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react'
import { supabase } from '../lib/supabase'
import { generateUUID } from '../lib/uuid'
import { seedInitialData } from '../lib/seedData'
import { useSeasons } from '../hooks/useSeasons'
import { useLeagues } from '../hooks/useLeagues'
import { useTeamsWithPlayers } from '../hooks/useTeams'
import { useMatches } from '../hooks/useMatches'
import { useStandings } from '../hooks/useStandings'
import { useTopScorers } from '../hooks/useTopScorers'
import type {
  Season,
  League,
  TeamWithPlayers,
  Match,
  Standing,
  TopScorer,
  MatchPlayerStats,
} from '../types/database'

// ── Типы мутаций ──────────────────────────────────────────────────────────────

export interface SaveMatchResultArgs {
  matchId:   string
  scoreA:    number
  scoreB:    number
  playedAt?: string
  stats?:    Omit<MatchPlayerStats, 'id' | 'match_id'>[]
}

export interface CreateSeasonArgs {
  name: string
  year: number
}

export interface CreateLeagueArgs {
  seasonId: string
  name: string
  sortOrder?: number
}

export interface CreateTeamArgs {
  leagueId: string
  name: string
  color: string
  logoUrl?: string | null
}

export interface CreateMatchArgs {
  leagueId: string
  teamAId: string
  teamBId: string
  tour: number
  scheduledAt?: string | null
  venue?: string | null
}

export interface CreatePlayerArgs {
  teamId: string
  name: string
  number?: number | null
  photoUrl?: string | null
}

export interface UpdateMatchArgs {
  matchId: string
  tour?: number
  status?: 'scheduled' | 'played' | 'cancelled'
  scheduledAt?: string | null
  teamAId?: string
  teamBId?: string
  venue?: string | null
}

export interface UpdateTeamArgs {
  teamId: string
  name?: string
  color?: string
  logoUrl?: string | null
}

export interface UpdateSeasonArgs {
  seasonId: string
  name?: string
  year?: number
  status?: 'active' | 'archived'
}

export interface CreatePlayedMatchArgs {
  leagueId: string
  teamAId:  string
  teamBId:  string
  scoreA:   number
  scoreB:   number
  playedAt: string  // ISO-строка
  stats?:   Omit<MatchPlayerStats, 'id' | 'match_id'>[]
}

// ── Тип контекста ─────────────────────────────────────────────────────────────

interface DataContextValue {
  // Данные
  seasons:        Season[]
  season:         Season | null
  leagues:        League[]
  selectedLeague: League | null
  teams:          TeamWithPlayers[]
  matches:        Match[]
  standings:      Standing[]
  scorers:        TopScorer[]

  // Состояние загрузки
  loadingSeasons:  boolean
  loadingLeagues:  boolean
  loadingTeams:    boolean
  loadingMatches:  boolean
  loadingStandings: boolean
  loadingScorers:  boolean

  // Ошибки (null если нет ошибок, строка с сообщением если ошибка)
  errorSeasons:    string | null
  errorLeagues:    string | null
  errorTeams:      string | null
  errorMatches:    string | null
  errorStandings:  string | null
  errorScorers:    string | null
  hasError:        boolean

  // Выбор лиги
  selectLeague:  (league: League) => void
  selectSeason:  (season: Season) => void

  // Мутации (только для admin)
  saveMatchResult:  (args: SaveMatchResultArgs) => Promise<{ error: string | null }>

  // CREATE операции
  createSeason: (args: CreateSeasonArgs) => Promise<{ error: string | null }>
  createLeague: (args: CreateLeagueArgs) => Promise<{ error: string | null }>
  createTeam:   (args: CreateTeamArgs) => Promise<{ error: string | null }>
  createMatch:  (args: CreateMatchArgs) => Promise<{ error: string | null }>
  createPlayer: (args: CreatePlayerArgs) => Promise<{ error: string | null }>

  // DELETE операции
  deleteMatch:  (matchId: string) => Promise<{ error: string | null }>
  deleteTeam:   (teamId: string) => Promise<{ error: string | null }>
  deleteLeague: (leagueId: string) => Promise<{ error: string | null }>
  deleteSeason: (seasonId: string) => Promise<{ error: string | null }>
  deletePlayer: (playerId: string) => Promise<{ error: string | null }>

  // UPDATE операции
  updateMatch:   (args: UpdateMatchArgs)  => Promise<{ error: string | null }>
  updateTeam:    (args: UpdateTeamArgs)   => Promise<{ error: string | null }>
  updateSeason:  (args: UpdateSeasonArgs) => Promise<{ error: string | null }>

  // Создание уже сыгранного матча (без предварительного планирования)
  createPlayedMatch: (args: CreatePlayedMatchArgs) => Promise<{ error: string | null }>

  // Refetch функции
  refetchTeams:     () => void
  refetchMatches:   () => void
  refetchStandings: () => void
  refetchScorers:   () => void
  refetchSeasons:   () => void
  refetchLeagues:   () => void
}

// ── Создание контекста ────────────────────────────────────────────────────────

const DataContext = createContext<DataContextValue | null>(null)

// ── Провайдер ─────────────────────────────────────────────────────────────────

export function DataProvider({ children }: { children: ReactNode }) {
  // Автоматическая миграция данных при первом запуске
  const [seedingDone, setSeedingDone] = useState(false)

  useEffect(() => {
    async function initializeSeed() {
      const result = await seedInitialData()
      if (!result.success) {
        console.error('[DataProvider] Ошибка инициализации:', result.error)
      }
      setSeedingDone(true)
    }

    initializeSeed()
  }, [])

  // Сезоны
  const { seasons, loading: loadingSeasons, error: errorSeasons, refetch: refetchSeasons } = useSeasons()

  // Выбранный сезон (по умолчанию — активный или первый)
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null)
  const season = useMemo(() => {
    if (selectedSeasonId) return seasons.find(s => s.id === selectedSeasonId) ?? null
    return seasons.find(s => s.status === 'active') ?? seasons[0] ?? null
  }, [seasons, selectedSeasonId])

  // Лиги
  const { leagues, loading: loadingLeagues, error: errorLeagues, refetch: refetchLeagues } = useLeagues(season?.id ?? null)

  // Выбранная лига (по умолчанию — первая)
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null)

  const currentLeague = selectedLeague ?? leagues[0] ?? null

  const selectLeague = useCallback((league: League) => {
    setSelectedLeague(league)
  }, [])

  const selectSeason = useCallback((s: Season) => {
    setSelectedSeasonId(s.id)
    setSelectedLeague(null) // сброс лиги при смене сезона
  }, [])

  // Данные выбранной лиги
  const { teams,     loading: loadingTeams,     error: errorTeams,     refetch: refetchTeams     } = useTeamsWithPlayers(currentLeague?.id ?? null)
  const { matches,   loading: loadingMatches,   error: errorMatches,   refetch: refetchMatches   } = useMatches(currentLeague?.id ?? null)
  const { standings, loading: loadingStandings, error: errorStandings, refetch: refetchStandings } = useStandings(currentLeague?.id ?? null)
  const { scorers,   loading: loadingScorers,   error: errorScorers,   refetch: refetchScorers   } = useTopScorers(currentLeague?.id ?? null)

  // Проверка наличия ошибок
  const hasError = !!(errorSeasons || errorLeagues || errorTeams || errorMatches || errorStandings || errorScorers)

  // ── Мутации ───────────────────────────────────────────────────────────────

  const saveMatchResult = useCallback(async ({
    matchId, scoreA, scoreB, playedAt, stats = [],
  }: SaveMatchResultArgs): Promise<{ error: string | null }> => {
    const { error: matchErr } = await supabase
      .from('matches')
      .update({
        score_a: scoreA,
        score_b: scoreB,
        status: 'played',
        played_at: playedAt ?? new Date().toISOString(),
      })
      .eq('id', matchId)
    if (matchErr) return { error: matchErr.message }
    if (stats.length > 0) {
      await supabase.from('match_player_stats').delete().eq('match_id', matchId)
      const rows = stats.map(s => ({ ...s, id: generateUUID(), match_id: matchId }))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: statsErr } = await (supabase.from('match_player_stats') as any).insert(rows)
      if (statsErr) return { error: statsErr.message }
    }
    refetchMatches(); refetchStandings(); refetchScorers()
    return { error: null }
  }, [refetchMatches, refetchStandings, refetchScorers])

  const createSeason = useCallback(async ({ name, year }: CreateSeasonArgs) => {
    const { error } = await supabase.from('seasons').insert({ id: generateUUID(), name, year, status: 'active' })
    if (!error) refetchSeasons()
    return { error: error?.message ?? null }
  }, [refetchSeasons])

  const createLeague = useCallback(async ({ seasonId, name, sortOrder = 0 }: CreateLeagueArgs) => {
    const { error } = await supabase.from('leagues').insert({ id: generateUUID(), season_id: seasonId, name, sort_order: sortOrder })
    if (!error) refetchLeagues()
    return { error: error?.message ?? null }
  }, [refetchLeagues])

  const createTeam = useCallback(async ({ leagueId, name, color, logoUrl }: CreateTeamArgs) => {
    const { error } = await supabase.from('teams').insert({ id: generateUUID(), league_id: leagueId, name, color, logo_url: logoUrl ?? null })
    if (!error) refetchTeams()
    return { error: error?.message ?? null }
  }, [refetchTeams])

  const createMatch = useCallback(async ({ leagueId, teamAId, teamBId, tour, scheduledAt, venue }: CreateMatchArgs) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('matches').insert({ id: generateUUID(), league_id: leagueId, team_a_id: teamAId, team_b_id: teamBId, tour, status: 'scheduled', scheduled_at: scheduledAt ?? null, venue: venue ?? null })
    if (!error) refetchMatches()
    return { error: error?.message ?? null }
  }, [refetchMatches])

  const createPlayer = useCallback(async ({ teamId, name, number, photoUrl }: CreatePlayerArgs) => {
    const { error } = await supabase.from('players').insert({ id: generateUUID(), team_id: teamId, name, number: number ?? null, photo_url: photoUrl ?? null })
    if (!error) refetchTeams()
    return { error: error?.message ?? null }
  }, [refetchTeams])

  const deleteMatch = useCallback(async (matchId: string) => {
    const { error } = await supabase.from('matches').delete().eq('id', matchId)
    if (!error) { refetchMatches(); refetchStandings(); refetchScorers() }
    return { error: error?.message ?? null }
  }, [refetchMatches, refetchStandings, refetchScorers])

  const deleteTeam = useCallback(async (teamId: string) => {
    const { error } = await supabase.from('teams').delete().eq('id', teamId)
    if (!error) { refetchTeams(); refetchStandings() }
    return { error: error?.message ?? null }
  }, [refetchTeams, refetchStandings])

  const deleteLeague = useCallback(async (leagueId: string) => {
    const { error } = await supabase.from('leagues').delete().eq('id', leagueId)
    if (!error) refetchLeagues()
    return { error: error?.message ?? null }
  }, [refetchLeagues])

  const deleteSeason = useCallback(async (seasonId: string) => {
    const { error } = await supabase.from('seasons').delete().eq('id', seasonId)
    if (!error) refetchSeasons()
    return { error: error?.message ?? null }
  }, [refetchSeasons])

  const deletePlayer = useCallback(async (playerId: string) => {
    const { error } = await supabase.from('players').delete().eq('id', playerId)
    if (!error) refetchTeams()
    return { error: error?.message ?? null }
  }, [refetchTeams])

  const updateTeam = useCallback(async ({ teamId, name, color, logoUrl }: UpdateTeamArgs) => {
    const update: Record<string, unknown> = {}
    if (name    !== undefined) update.name     = name
    if (color   !== undefined) update.color    = color
    if (logoUrl !== undefined) update.logo_url = logoUrl
    const { error } = await supabase.from('teams').update(update).eq('id', teamId)
    if (!error) refetchTeams()
    return { error: error?.message ?? null }
  }, [refetchTeams])

  const updateMatch = useCallback(async ({ matchId, tour, status, scheduledAt, teamAId, teamBId, venue }: UpdateMatchArgs) => {
    const update: Record<string, unknown> = {}
    if (tour        !== undefined) update.tour         = tour
    if (status      !== undefined) update.status       = status
    if (scheduledAt !== undefined) update.scheduled_at = scheduledAt
    if (teamAId     !== undefined) update.team_a_id    = teamAId
    if (teamBId     !== undefined) update.team_b_id    = teamBId
    if (venue       !== undefined) update.venue        = venue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('matches').update(update).eq('id', matchId)
    if (!error) refetchMatches()
    return { error: error?.message ?? null }
  }, [refetchMatches])

  const updateSeason = useCallback(async ({ seasonId, name, year, status }: UpdateSeasonArgs) => {
    const update: Record<string, unknown> = {}
    if (name   !== undefined) update.name   = name
    if (year   !== undefined) update.year   = year
    if (status !== undefined) {
      // При активации этого сезона — архивируем все остальные
      if (status === 'active') {
        await supabase.from('seasons').update({ status: 'archived' }).neq('id', seasonId)
      }
      update.status = status
    }
    const { error } = await supabase.from('seasons').update(update).eq('id', seasonId)
    if (!error) refetchSeasons()
    return { error: error?.message ?? null }
  }, [refetchSeasons])

  /**
   * Создаёт матч напрямую со статусом 'played'.
   * Номер тура определяется автоматически (max + 1 по лиге).
   * После сохранения триггерит пересчёт standings и scorers.
   */
  const createPlayedMatch = useCallback(async ({
    leagueId, teamAId, teamBId, scoreA, scoreB, playedAt, stats = [],
  }: CreatePlayedMatchArgs): Promise<{ error: string | null }> => {
    // Определяем следующий номер тура
    const tourRes = await supabase
      .from('matches')
      .select('tour')
      .eq('league_id', leagueId)
      .order('tour', { ascending: false })
      .limit(1)
    const tourRows = tourRes.data as { tour: number }[] | null
    const nextTour = (tourRows?.[0]?.tour ?? 0) + 1

    // Генерируем ID заранее, чтобы использовать его для статистики
    const matchId = generateUUID()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: matchErr } = await (supabase.from('matches') as any).insert({
      id:           matchId,
      league_id:    leagueId,
      team_a_id:    teamAId,
      team_b_id:    teamBId,
      score_a:      scoreA,
      score_b:      scoreB,
      tour:         nextTour,
      status:       'played',
      played_at:    playedAt,
      scheduled_at: playedAt,
    })
    if (matchErr) return { error: matchErr.message }

    // Сохраняем статистику игроков (если предоставлена)
    if (stats.length > 0) {
      const rows = stats.map(s => ({ ...s, id: generateUUID(), match_id: matchId }))
      const { error: statsErr } = await (supabase.from('match_player_stats') as any).insert(rows)  // eslint-disable-line
      if (statsErr) return { error: statsErr.message }
    }

    refetchMatches()
    refetchStandings()
    refetchScorers()
    return { error: null }
  }, [refetchMatches, refetchStandings, refetchScorers])

  // ── Возврат Provider ─────────────────────────────────────────────────────────

  return (
    <DataContext.Provider value={{
      seasons, season, leagues, selectedLeague: currentLeague,
      teams, matches, standings, scorers,
      loadingSeasons, loadingLeagues, loadingTeams,
      loadingMatches, loadingStandings, loadingScorers,
      errorSeasons, errorLeagues, errorTeams,
      errorMatches, errorStandings, errorScorers,
      hasError,
      selectLeague, selectSeason,
      saveMatchResult,
      createSeason, createLeague, createTeam, createMatch, createPlayer,
      deleteMatch, deleteTeam, deleteLeague, deleteSeason, deletePlayer,
      updateMatch, updateTeam, updateSeason, createPlayedMatch,
      refetchTeams, refetchMatches, refetchStandings, refetchScorers,
      refetchSeasons, refetchLeagues,
    }}>
      {seedingDone ? children : null}
    </DataContext.Provider>
  )
}

// ── Хук потребителя ───────────────────────────────────────────────────────────

export function useData(): DataContextValue {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used inside <DataProvider>')
  return ctx
}
