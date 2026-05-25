import type { Standing } from '../types/database'
import type { Match } from '../types/database'

/**
 * Re-sorts standings with head-to-head tiebreaker.
 *
 * Tiebreaker order when points are equal:
 *   1. H2H points among the tied group
 *   2. H2H goal difference among the tied group
 *   3. H2H goals scored among the tied group
 *   4. Overall goal difference
 *   5. Overall goals scored
 */
export function sortStandingsWithH2H(standings: Standing[], matches: Match[]): Standing[] {
  if (standings.length <= 1) return standings

  const playedMatches = matches.filter(m => m.status === 'played')

  // Group consecutive rows with equal points (standings already sorted by pts from DB)
  const sorted = [...standings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.goal_diff !== a.goal_diff) return b.goal_diff - a.goal_diff
    return b.goals_for - a.goals_for
  })

  // Find groups with equal points and apply H2H within each group
  const result: Standing[] = []
  let i = 0
  while (i < sorted.length) {
    let j = i + 1
    while (j < sorted.length && sorted[j].points === sorted[i].points) j++
    const group = sorted.slice(i, j)
    result.push(...(group.length > 1 ? sortGroupH2H(group, playedMatches) : group))
    i = j
  }

  return result
}

function sortGroupH2H(group: Standing[], matches: Match[]): Standing[] {
  const ids = new Set(group.map(s => s.team_id))

  // Matches played between the tied teams only
  const h2h = matches.filter(m => ids.has(m.team_a_id) && ids.has(m.team_b_id))

  // Build H2H mini-table
  type MiniRow = { pts: number; gd: number; gf: number }
  const mini = new Map<string, MiniRow>()
  for (const s of group) mini.set(s.team_id, { pts: 0, gd: 0, gf: 0 })

  for (const m of h2h) {
    const sA = m.score_a ?? 0
    const sB = m.score_b ?? 0
    const a = mini.get(m.team_a_id)!
    const b = mini.get(m.team_b_id)!
    a.gf += sA
    a.gd += sA - sB
    b.gf += sB
    b.gd += sB - sA
    if (sA > sB) { a.pts += 3 }
    else if (sA === sB) { a.pts += 1; b.pts += 1 }
    else { b.pts += 3 }
  }

  return [...group].sort((a, b) => {
    const ha = mini.get(a.team_id)!
    const hb = mini.get(b.team_id)!
    if (hb.pts !== ha.pts) return hb.pts - ha.pts   // H2H points
    if (hb.gd  !== ha.gd)  return hb.gd  - ha.gd   // H2H goal diff
    if (hb.gf  !== ha.gf)  return hb.gf  - ha.gf   // H2H goals scored
    if (b.goal_diff !== a.goal_diff) return b.goal_diff - a.goal_diff // general GD
    return b.goals_for - a.goals_for                                   // general GF
  })
}
