import type { Standing } from '../types/database'
import { Spinner } from '../components/Spinner'
import { Empty } from '../components/ui/Empty'

const POSITION_STYLE = (i: number): React.CSSProperties => {
  if (i === 0) return { borderLeft: '3px solid var(--color-brand-primary)', background: 'rgba(122,219,138,0.05)' }
  if (i === 1) return { borderLeft: '3px solid rgba(255,255,255,0.30)' }
  if (i === 2) return { borderLeft: '3px solid var(--color-brand-gold)' }
  return { borderLeft: '3px solid transparent' }
}

const POSITION_BADGE = (i: number) => {
  if (i === 0) return <span style={{ color: 'var(--color-brand-primary)', fontWeight: 800 }}>1</span>
  if (i === 1) return <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>2</span>
  if (i === 2) return <span style={{ color: 'var(--color-brand-gold)', fontWeight: 700 }}>3</span>
  return <span style={{ color: 'var(--color-brand-outline)' }}>{i + 1}</span>
}

interface Props {
  standings: Standing[]
  loading: boolean
  error?: string | null
  leagueName?: string
  seasonName?: string
}

export function StandingsPage({ standings, loading, error, leagueName, seasonName }: Props) {
  if (loading) return <Spinner className="py-20" />
  if (error) return <Empty text={`❌ Ошибка: ${error}`} />
  if (!standings.length) return <Empty text="Команды не найдены" />

  // Stats
  const totalGames  = Math.round(standings.reduce((s, r) => s + r.played, 0) / 2)
  const totalGoals  = standings.reduce((s, r) => s + r.goals_for, 0)
  const avgGoals    = totalGames > 0 ? (totalGoals / totalGames).toFixed(1) : '—'

  return (
    <div className="space-y-4">

      {/* Page header + stats cards */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold" style={{ color: 'var(--color-brand-text)' }}>
            Турнирная таблица
          </h2>
          {(seasonName || leagueName) && (
            <p className="mt-1 text-sm" style={{ color: 'var(--color-brand-text-muted)' }}>
              {seasonName}{seasonName && leagueName ? ' • ' : ''}{leagueName}
            </p>
          )}
        </div>

        {totalGames > 0 && (
          <div className="flex gap-3 flex-shrink-0">
            <div
              className="rounded-xl px-4 py-3 text-center min-w-[90px]"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="label-caps text-[9px] mb-1" style={{ color: 'var(--color-brand-outline)' }}>
                Игры
              </div>
              <div className="text-xl font-bold" style={{ color: 'var(--color-brand-text)' }}>
                {totalGames}
              </div>
            </div>
            <div
              className="rounded-xl px-4 py-3 text-center min-w-[90px]"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="label-caps text-[9px] mb-1" style={{ color: 'var(--color-brand-outline)' }}>
                Голов / игра
              </div>
              <div className="text-xl font-bold" style={{ color: 'var(--color-brand-text)' }}>
                {avgGoals}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile cards */}
      <div className="space-y-2 sm:hidden">
        {standings.map((row, i) => (
          <div
            key={row.team_id}
            className="rounded-xl p-3 flex items-center justify-between gap-3"
            style={{ ...POSITION_STYLE(i), background: i === 0 ? 'rgba(122,219,138,0.05)' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <span className="font-mono text-sm w-5 text-center flex-shrink-0">{POSITION_BADGE(i)}</span>
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: row.color }} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate" style={{ color: 'var(--color-brand-text)' }}>{row.team_name}</div>
                <div className="text-xs" style={{ color: 'var(--color-brand-outline)' }}>
                  {row.wins}В {row.draws}Н {row.losses}П
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-right">
                <div className="text-lg font-bold" style={{ color: 'var(--color-brand-text)' }}>{row.points}</div>
                <div className="text-xs" style={{ color: 'var(--color-brand-outline)' }}>{row.played} игр</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div
        className="hidden sm:block rounded-2xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <th className="label-caps text-[10px] py-3 px-4 text-left w-10" style={{ color: 'var(--color-brand-outline)' }}>#</th>
              <th className="label-caps text-[10px] py-3 px-3 text-left" style={{ color: 'var(--color-brand-outline)' }}>Команда</th>
              <th className="label-caps text-[10px] py-3 px-3 text-center" style={{ color: 'var(--color-brand-outline)' }}>И</th>
              <th className="label-caps text-[10px] py-3 px-3 text-center" style={{ color: 'var(--color-brand-outline)' }}>В</th>
              <th className="label-caps text-[10px] py-3 px-3 text-center" style={{ color: 'var(--color-brand-outline)' }}>Н</th>
              <th className="label-caps text-[10px] py-3 px-3 text-center" style={{ color: 'var(--color-brand-outline)' }}>П</th>
              <th className="label-caps text-[10px] py-3 px-3 text-center hidden md:table-cell" style={{ color: 'var(--color-brand-outline)' }}>ГЗ</th>
              <th className="label-caps text-[10px] py-3 px-3 text-center hidden md:table-cell" style={{ color: 'var(--color-brand-outline)' }}>ГП</th>
              <th className="label-caps text-[10px] py-3 px-3 text-center hidden lg:table-cell" style={{ color: 'var(--color-brand-outline)' }}>+/−</th>
              <th className="label-caps text-[10px] py-3 px-4 text-center font-bold" style={{ color: 'var(--color-brand-text)' }}>О</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row, i) => (
              <tr
                key={row.team_id}
                className="transition-colors"
                style={{
                  ...POSITION_STYLE(i),
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  background: i === 0 ? 'rgba(122,219,138,0.04)' : 'transparent',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                onMouseLeave={e => (e.currentTarget.style.background = i === 0 ? 'rgba(122,219,138,0.04)' : 'transparent')}
              >
                <td className="py-3 px-4 font-mono text-sm">{POSITION_BADGE(i)}</td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: row.color }} />
                    <span className="font-medium" style={{ color: 'var(--color-brand-text)' }}>{row.team_name}</span>
                  </div>
                </td>
                <td className="py-3 px-3 text-center" style={{ color: 'var(--color-brand-text-muted)' }}>{row.played}</td>
                <td className="py-3 px-3 text-center font-medium" style={{ color: 'var(--color-brand-primary)' }}>{row.wins}</td>
                <td className="py-3 px-3 text-center" style={{ color: 'var(--color-brand-gold)' }}>{row.draws}</td>
                <td className="py-3 px-3 text-center" style={{ color: '#f87171' }}>{row.losses}</td>
                <td className="py-3 px-3 text-center hidden md:table-cell" style={{ color: 'var(--color-brand-text-muted)' }}>{row.goals_for}</td>
                <td className="py-3 px-3 text-center hidden md:table-cell" style={{ color: 'var(--color-brand-text-muted)' }}>{row.goals_against}</td>
                <td className="py-3 px-3 text-center hidden lg:table-cell" style={{ color: row.goal_diff > 0 ? 'var(--color-brand-primary)' : row.goal_diff < 0 ? '#f87171' : 'var(--color-brand-outline)' }}>
                  {row.goal_diff > 0 ? '+' : ''}{row.goal_diff}
                </td>
                <td className="py-3 px-4 text-center text-base font-bold" style={{ color: 'var(--color-brand-text)' }}>{row.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  )
}
