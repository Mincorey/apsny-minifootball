/**
 * seedData — миграция начальных данных в Supabase
 *
 * Импортирует initialTeams и initialMatches из constants.ts
 * и создает их в БД при первом запуске приложения.
 */

import { supabase } from './supabase'
import { generateUUID } from './uuid'
import { initialTeams, initialMatches } from '../constants'

interface SeedResult {
  success: boolean
  error?: string
  seasonId?: string
  leagueIds?: string[]
}

export async function seedInitialData(): Promise<SeedResult> {
  try {
    // Проверяем: уже ли есть сезоны?
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const { data: seasons, error: checkErr } = await db
      .from('seasons')
      .select('id')
      .limit(1)

    if (checkErr) {
      return { success: false, error: `Ошибка проверки БД: ${checkErr.message}` }
    }

    // Если уже есть сезоны — ничего не делаем
    if (seasons && seasons.length > 0) {
      console.log('[Seed] База уже инициализирована')
      return { success: true }
    }

    console.log('[Seed] Начало миграции данных...')

    // 1️⃣ Создаем сезон
    const seasonId = generateUUID()
    const { error: seasonErr } = await db
      .from('seasons')
      .insert({
        id: seasonId,
        name: 'Сезон 2026',
        year: 2026,
        status: 'active',
      })

    if (seasonErr) {
      return { success: false, error: `Ошибка создания сезона: ${seasonErr.message}` }
    }
    console.log('[Seed] ✅ Сезон создан')

    // 2️⃣ Создаем лиги (Лига 1 и Лига 2)
    const league1Id = generateUUID()
    const league2Id = generateUUID()

    const { error: leaguesErr } = await db
      .from('leagues')
      .insert([
        { id: league1Id, season_id: seasonId, name: 'Лига 1', sort_order: 1 },
        { id: league2Id, season_id: seasonId, name: 'Лига 2', sort_order: 2 },
      ])

    if (leaguesErr) {
      return { success: false, error: `Ошибка создания лиг: ${leaguesErr.message}` }
    }
    console.log('[Seed] ✅ Лиги созданы')

    // 3️⃣ Маппируем старые ID на новые UUID
    const teamIdMap = new Map<number, string>()

    // 4️⃣ Создаем команды
    const teamInserts: Array<{
      id: string
      league_id: string
      name: string
      color: string
      logo_url: string | null
    }> = []

    for (const team of initialTeams) {
      const newTeamId = generateUUID()
      teamIdMap.set(team.id, newTeamId)

      const leagueId = team.league === 1 ? league1Id : league2Id
      teamInserts.push({
        id: newTeamId,
        league_id: leagueId,
        name: team.name,
        color: team.color,
        logo_url: null, // пока нет логотипов, ставим null
      })
    }

    const { error: teamsErr } = await db
      .from('teams')
      .insert(teamInserts)

    if (teamsErr) {
      return { success: false, error: `Ошибка создания команд: ${teamsErr.message}` }
    }
    console.log(`[Seed] ✅ Команды созданы (${teamInserts.length})`)

    // 5️⃣ Создаем игроков
    const playerInserts: Array<{
      id: string
      team_id: string
      name: string
      number: number | null
      photo_url: string | null
      permanent_ban: boolean
      ban_matches: number
    }> = []

    for (const team of initialTeams) {
      const newTeamId = teamIdMap.get(team.id)!
      for (const player of team.players) {
        playerInserts.push({
          id: generateUUID(),
          team_id: newTeamId,
          name: player.name,
          number: player.number ?? null,
          photo_url: null,
          permanent_ban: player.permanentBan ?? false,
          ban_matches: player.banMatches ?? 0,
        })
      }
    }

    const { error: playersErr } = await db
      .from('players')
      .insert(playerInserts)

    if (playersErr) {
      return { success: false, error: `Ошибка создания игроков: ${playersErr.message}` }
    }
    console.log(`[Seed] ✅ Игроки созданы (${playerInserts.length})`)

    // 6️⃣ Создаем матчи
    const matchInserts: Array<{
      id: string
      league_id: string
      team_a_id: string
      team_b_id: string
      tour: number
      status: 'played' | 'scheduled' | 'cancelled'
      score_a: number | null
      score_b: number | null
      scheduled_at: string | null
      played_at: string | null
    }> = []

    for (const match of initialMatches) {
      const leagueId = match.league === 1 ? league1Id : league2Id
      const teamAId = teamIdMap.get(match.teamAId)!
      const teamBId = teamIdMap.get(match.teamBId)!

      matchInserts.push({
        id: generateUUID(),
        league_id: leagueId,
        team_a_id: teamAId,
        team_b_id: teamBId,
        tour: match.tour,
        status: 'played', // все матчи уже сыграны (есть scores)
        score_a: match.scoreA,
        score_b: match.scoreB,
        scheduled_at: null,
        played_at: match.date, // дата игры
      })
    }

    const { error: matchesErr } = await db
      .from('matches')
      .insert(matchInserts)

    if (matchesErr) {
      return { success: false, error: `Ошибка создания матчей: ${matchesErr.message}` }
    }
    console.log(`[Seed] ✅ Матчи созданы (${matchInserts.length})`)

    console.log('[Seed] 🎉 Миграция завершена успешно!')
    return { success: true, seasonId, leagueIds: [league1Id, league2Id] }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[Seed] ❌ Ошибка:', message)
    return { success: false, error: message }
  }
}
