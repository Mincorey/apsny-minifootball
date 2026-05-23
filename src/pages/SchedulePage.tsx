import { useMemo } from 'react'
import { ClipboardList } from 'lucide-react'
import type { Match, TeamWithPlayers } from '../types/database'
import { Spinner } from '../components/Spinner'
import { Empty } from '../components/ui/Empty'
import { TeamLabel } from '../components/ui/TeamLabel'
import { fmtDateTime } from '../utils/dateFormatters'

interface SchedulePageProps {
  matches: Match[]
  teams: TeamWithPlayers[]
  loading: boolean
  isAdmin: boolean
  onEnterResult: (m: Match) => void
  error?: string | null
}

export function SchedulePage({ matches, teams, loading, isAdmin, onEnterResult, error }: SchedulePageProps) {
  if (loading) return <Spinner className="py-20" />
  if (error) return <Empty text={`Ошибка: ${error}`} />

  const teamMap = useMemo(() => new Map(teams.map(t => [t.id, t])), [teams])

  const upcoming = matches
    .filter(m => m.status === 'scheduled')
    .sort((a, b) => (a.scheduled_at ?? '').localeCompare(b.scheduled_at ?? ''))

  if (!upcoming.length) return <Empty text="Запланированных матчей нет" />

  return (
    <div className="space-y-3">
      {upcoming.map(m => {
        const teamA = teamMap.get(m.team_a_id)
        const teamB = teamMap.get(m.team_b_id)
        const dt = fmtDateTime(m.scheduled_at)

        return (
          <div
            key={m.id}
            className="bento-card px-4 py-3.5"
          >
            {/* Top: date/tour + admin button */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span
                  className="label-caps px-2.5 py-1 rounded-full text-[10px]"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--color-brand-text-muted)' }}
                >
                  ТУР {m.tour}
                </span>
                {dt && (
                  <span className="label-caps text-[10px]" style={{ color: 'var(--color-brand-text-muted)' }}>
                    {dt}
                  </span>
                )}
              </div>

              {isAdmin && (
                <button
                  onClick={() => onEnterResult(m)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold label-caps transition-all active:scale-95"
                  style={{ background: 'rgba(0,117,49,0.18)', color: 'var(--color-brand-primary)', border: '1px solid rgba(122,219,138,0.20)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,117,49,0.30)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,117,49,0.18)')}
                >
                  <ClipboardList size={12} />
                  Ввести результат
                </button>
              )}
            </div>

            {/* Teams vs */}
            <div className="flex items-center gap-2">
              <TeamLabel team={teamA} align="left" />

              <div
                className="flex-shrink-0 px-4 py-1.5 rounded-xl mx-1 text-center"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                <span className="text-sm font-black" style={{ color: 'var(--color-brand-text-muted)' }}>VS</span>
              </div>

              <TeamLabel team={teamB} align="right" />
            </div>
          </div>
        )
      })}
    </div>
  )
}
