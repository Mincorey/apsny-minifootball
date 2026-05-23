import { useMemo } from 'react'
import type { Match, TeamWithPlayers } from '../types/database'
import { Spinner } from '../components/Spinner'
import { Empty } from '../components/ui/Empty'
import { fmtDate } from '../utils/dateFormatters'

interface ToursPageProps {
  matches: Match[]
  teams: TeamWithPlayers[]
  loading: boolean
  error?: string | null
}

function TeamRow({
  team,
  score,
  isWinner,
  isLoser,
}: {
  team: TeamWithPlayers | undefined
  score: number
  isWinner: boolean
  isLoser: boolean
}) {
  const initials = team
    ? team.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <div className="flex items-center gap-3">
      {/* Logo */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden font-bold text-sm"
        style={{
          background: team?.color ? `${team.color}33` : 'rgba(255,255,255,0.08)',
          border: `2px solid ${team?.color ?? 'rgba(255,255,255,0.15)'}`,
          color: team?.color ?? 'var(--color-brand-primary)',
        }}
      >
        {team?.logo_url
          ? <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
          : initials
        }
      </div>

      {/* Team name — grows, wraps freely */}
      <span
        className="flex-1 text-sm font-semibold leading-snug"
        style={{
          color: isLoser
            ? 'var(--color-brand-text-muted)'
            : 'var(--color-brand-text)',
          opacity: isLoser ? 0.7 : 1,
        }}
      >
        {team?.name ?? '—'}
      </span>

      {/* Score */}
      <span
        className="text-2xl font-black tabular-nums w-9 text-right flex-shrink-0"
        style={{
          color: isWinner
            ? 'var(--color-brand-primary)'
            : isLoser
            ? '#ef4444'
            : 'var(--color-brand-text)',
        }}
      >
        {score}
      </span>
    </div>
  )
}

export function ToursPage({ matches, teams, loading, error }: ToursPageProps) {
  if (loading) return <Spinner className="py-20" />
  if (error) return <Empty text={`Ошибка: ${error}`} />

  const teamMap = useMemo(() => new Map(teams.map(t => [t.id, t])), [teams])
  const played = matches.filter(m => m.status === 'played')
  if (!played.length) return <Empty text="Сыгранных матчей ещё нет" />

  const tours = useMemo(() => {
    const map = new Map<number, Match[]>()
    for (const m of played) {
      const arr = map.get(m.tour) ?? []
      arr.push(m)
      map.set(m.tour, arr)
    }
    return Array.from(map.entries()).sort((a, b) => b[0] - a[0])
  }, [played])

  return (
    <div className="space-y-8">
      {tours.map(([tourNum, tourMatches]) => (
        <div key={tourNum}>
          {/* Tour header */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0"
              style={{ background: 'var(--color-brand-accent)', color: '#fff', boxShadow: '0 0 10px rgba(0,117,49,0.35)' }}
            >
              {tourNum}
            </div>
            <p className="text-base font-bold flex-shrink-0" style={{ color: 'var(--color-brand-text)' }}>
              Тур {tourNum}
            </p>
            <div className="flex-1 h-px" style={{ background: 'var(--color-brand-border-subtle)' }} />
            <p className="label-caps text-[10px] flex-shrink-0" style={{ color: 'var(--color-brand-text-muted)' }}>
              {tourMatches.length} {tourMatches.length === 1 ? 'матч' : tourMatches.length < 5 ? 'матча' : 'матчей'}
            </p>
          </div>

          {/* Match cards */}
          <div className="space-y-3">
            {tourMatches.map(m => {
              const teamA = teamMap.get(m.team_a_id)
              const teamB = teamMap.get(m.team_b_id)
              const sA = m.score_a ?? 0
              const sB = m.score_b ?? 0
              const winA = sA > sB
              const winB = sB > sA

              return (
                <div key={m.id} className="bento-card px-4 py-3.5 space-y-3">
                  {/* Date + status */}
                  <div className="flex items-center justify-between">
                    <span className="label-caps text-[10px]" style={{ color: 'var(--color-brand-text-muted)' }}>
                      {fmtDate(m.played_at)}
                    </span>
                    <span
                      className="label-caps text-[10px] px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(122,219,138,0.12)', color: 'var(--color-brand-primary)' }}
                    >
                      ЗАВЕРШЁН
                    </span>
                  </div>

                  {/* Team A */}
                  <TeamRow team={teamA} score={sA} isWinner={winA} isLoser={winB} />

                  {/* Divider */}
                  <div
                    className="flex items-center gap-2"
                    style={{ color: 'var(--color-brand-text-muted)' }}
                  >
                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
                    <span className="text-[10px] label-caps">vs</span>
                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
                  </div>

                  {/* Team B */}
                  <TeamRow team={teamB} score={sB} isWinner={winB} isLoser={winA} />
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
