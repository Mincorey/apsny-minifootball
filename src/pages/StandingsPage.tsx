import type { Standing } from '../types/database'
import { Spinner } from '../components/Spinner'
import { Empty } from '../components/ui/Empty'

// Base background for sticky cells — must be solid to cover scrolled content
const STICKY_BG = '#0f131c' // = var(--color-brand-surface)

// Width of the # column (rank) in px — used to offset Команда sticky left
const RANK_W = 44

const POSITION_BADGE = (i: number) => {
  if (i === 0) return <span style={{ color: 'var(--color-brand-primary)', fontWeight: 800 }}>1</span>
  if (i === 1) return <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>2</span>
  if (i === 2) return <span style={{ color: 'var(--color-brand-gold)', fontWeight: 700 }}>3</span>
  return <span style={{ color: 'var(--color-brand-outline)' }}>{i + 1}</span>
}

const RANK_BORDER = (i: number): string => {
  if (i === 0) return '3px solid var(--color-brand-primary)'
  if (i === 1) return '3px solid rgba(255,255,255,0.30)'
  if (i === 2) return '3px solid var(--color-brand-gold)'
  return '3px solid transparent'
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
  if (error)   return <Empty text={`❌ Ошибка: ${error}`} />
  if (!standings.length) return <Empty text="Команды не найдены" />

  return (
    <div className="space-y-4">

      {/* Page header */}
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

      {/*
        Unified table for ALL screen sizes.
        On mobile: horizontal scroll + sticky # and Команда columns.
        border-radius + overflow-x:auto on the SAME element is intentional —
        this correctly clips to rounded corners AND allows scroll (no sticky conflict).
      */}
      <div className="relative">
        <div
          className="rounded-2xl overflow-x-auto"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            WebkitOverflowScrolling: 'touch',
          } as React.CSSProperties}
        >
          <table className="w-full text-sm" style={{ minWidth: '560px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>

                {/* Sticky # */}
                <th
                  className="label-caps text-[10px] py-3 text-center"
                  style={{
                    color: 'var(--color-brand-outline)',
                    position: 'sticky', left: 0, zIndex: 3,
                    background: STICKY_BG,
                    width: `${RANK_W}px`, minWidth: `${RANK_W}px`,
                  }}
                >#</th>

                {/* Sticky Команда */}
                <th
                  className="label-caps text-[10px] py-3 px-2 text-left"
                  style={{
                    color: 'var(--color-brand-outline)',
                    position: 'sticky', left: `${RANK_W}px`, zIndex: 3,
                    background: STICKY_BG,
                    minWidth: '110px',
                  }}
                >Команда</th>

                <th className="label-caps text-[10px] py-3 px-2 text-center" style={{ color: 'var(--color-brand-outline)', width: '36px' }}>И</th>
                <th className="label-caps text-[10px] py-3 px-2 text-center" style={{ color: 'var(--color-brand-outline)', width: '36px' }}>В</th>
                <th className="label-caps text-[10px] py-3 px-2 text-center" style={{ color: 'var(--color-brand-outline)', width: '36px' }}>Н</th>
                <th className="label-caps text-[10px] py-3 px-2 text-center" style={{ color: 'var(--color-brand-outline)', width: '36px' }}>П</th>
                <th className="label-caps text-[10px] py-3 px-2 text-center" style={{ color: 'var(--color-brand-outline)', width: '36px' }}>ГЗ</th>
                <th className="label-caps text-[10px] py-3 px-2 text-center" style={{ color: 'var(--color-brand-outline)', width: '36px' }}>ГП</th>
                <th className="label-caps text-[10px] py-3 px-2 text-center" style={{ color: 'var(--color-brand-outline)', width: '42px' }}>+/−</th>
                <th className="label-caps text-[10px] py-3 px-3 text-center font-bold" style={{ color: 'var(--color-brand-text)', width: '42px' }}>О</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row, i) => (
                <tr
                  key={row.team_id}
                  className="transition-colors"
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    background: i === 0 ? 'rgba(122,219,138,0.04)' : 'transparent',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.035)')}
                  onMouseLeave={e => (e.currentTarget.style.background = i === 0 ? 'rgba(122,219,138,0.04)' : 'transparent')}
                >

                  {/* Sticky # — with left border for top-3 */}
                  <td
                    className="py-3 font-mono text-sm text-center"
                    style={{
                      position: 'sticky', left: 0, zIndex: 1,
                      background: STICKY_BG,
                      width: `${RANK_W}px`, minWidth: `${RANK_W}px`,
                      borderLeft: RANK_BORDER(i),
                    }}
                  >{POSITION_BADGE(i)}</td>

                  {/* Sticky Команда */}
                  <td
                    className="py-3 px-2"
                    style={{
                      position: 'sticky', left: `${RANK_W}px`, zIndex: 1,
                      background: STICKY_BG,
                      minWidth: '110px',
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: row.color }} />
                      <span className="font-medium text-xs leading-tight" style={{ color: 'var(--color-brand-text)' }}>{row.team_name}</span>
                    </div>
                  </td>

                  {/* Stats */}
                  <td className="py-3 px-2 text-center text-sm" style={{ color: 'var(--color-brand-text-muted)' }}>{row.played}</td>
                  <td className="py-3 px-2 text-center text-sm font-medium" style={{ color: 'var(--color-brand-primary)' }}>{row.wins}</td>
                  <td className="py-3 px-2 text-center text-sm" style={{ color: 'var(--color-brand-gold)' }}>{row.draws}</td>
                  <td className="py-3 px-2 text-center text-sm" style={{ color: '#f87171' }}>{row.losses}</td>
                  <td className="py-3 px-2 text-center text-sm" style={{ color: 'var(--color-brand-text-muted)' }}>{row.goals_for}</td>
                  <td className="py-3 px-2 text-center text-sm" style={{ color: 'var(--color-brand-text-muted)' }}>{row.goals_against}</td>
                  <td className="py-3 px-2 text-center text-sm" style={{
                    color: row.goal_diff > 0
                      ? 'var(--color-brand-primary)'
                      : row.goal_diff < 0
                      ? '#f87171'
                      : 'var(--color-brand-outline)',
                  }}>
                    {row.goal_diff > 0 ? '+' : ''}{row.goal_diff}
                  </td>
                  <td className="py-3 px-3 text-center text-base font-bold" style={{ color: 'var(--color-brand-text)' }}>{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right-edge fade hint — always present, only meaningful when table overflows on mobile */}
        <div
          className="absolute right-0 top-0 bottom-0 w-8 pointer-events-none rounded-r-2xl"
          style={{ background: 'linear-gradient(to right, transparent, rgba(15,19,28,0.85))' }}
          aria-hidden="true"
        />
      </div>

      {/* Column legend — shown below table */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1">
        {([
          ['И', 'игры'], ['В', 'победы'], ['Н', 'ничьи'], ['П', 'поражения'],
          ['ГЗ', 'забито'], ['ГП', 'пропущено'], ['+/−', 'разница'], ['О', 'очки'],
        ] as [string, string][]).map(([label, desc]) => (
          <div key={label} className="flex items-center gap-1">
            <span className="label-caps text-[9px] font-bold" style={{ color: 'var(--color-brand-primary)' }}>{label}</span>
            <span className="text-[10px]" style={{ color: 'var(--color-brand-outline)' }}>— {desc}</span>
          </div>
        ))}
      </div>

    </div>
  )
}
