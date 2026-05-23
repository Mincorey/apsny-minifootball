import { Users } from 'lucide-react'
import type { TopScorer } from '../types/database'
import { Spinner } from '../components/Spinner'
import { Empty } from '../components/ui/Empty'

export function ScorersPage({ scorers, loading, error }: { scorers: TopScorer[]; loading: boolean; error?: string | null }) {
  if (loading) return <Spinner className="py-20" />
  if (error) return <Empty text={`❌ Ошибка: ${error}`} />
  const filtered = scorers.filter(s => s.total_goals > 0)
  if (!filtered.length) return <Empty text="Статистика голов пока не внесена" />

  return (
    <div className="space-y-4">
      <h2 className="text-2xl sm:text-3xl font-extrabold" style={{ color: 'var(--color-brand-text)' }}>
        Бомбардиры
      </h2>

      <div className="space-y-2">
        {filtered.map((s, i) => {
          const isTop = i === 0
          return (
            <div
              key={s.player_id}
              className="flex items-center gap-3 p-3.5 rounded-xl transition-colors"
              style={{
                background: isTop ? 'rgba(255,185,95,0.07)' : 'rgba(255,255,255,0.03)',
                border: isTop
                  ? '1px solid rgba(255,185,95,0.20)'
                  : '1px solid rgba(255,255,255,0.06)',
                borderLeft: isTop
                  ? '3px solid var(--color-brand-gold)'
                  : i === 1
                  ? '3px solid rgba(255,255,255,0.30)'
                  : i === 2
                  ? '3px solid var(--color-brand-primary)'
                  : '3px solid transparent',
              }}
            >
              {/* Position */}
              <span
                className="font-mono text-sm w-6 text-center flex-shrink-0 font-bold"
                style={{ color: isTop ? 'var(--color-brand-gold)' : i === 1 ? 'rgba(255,255,255,0.5)' : i === 2 ? 'var(--color-brand-primary)' : 'var(--color-brand-outline)' }}
              >
                {i + 1}
              </span>

              {/* Avatar */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.08)', border: `1px solid ${isTop ? 'rgba(255,185,95,0.30)' : 'rgba(255,255,255,0.10)'}` }}
              >
                {s.photo_url
                  ? <img src={s.photo_url} className="w-10 h-10 rounded-full object-cover" alt="" />
                  : <Users size={16} style={{ color: 'var(--color-brand-outline)' }} />
                }
              </div>

              {/* Name + team */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate" style={{ color: 'var(--color-brand-text)' }}>
                  {s.player_name}
                  {s.permanent_ban && <span className="ml-2 text-xs" style={{ color: '#f87171' }}>БАН</span>}
                </div>
                <div className="text-xs truncate" style={{ color: 'var(--color-brand-text-muted)' }}>{s.team_name}</div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-3 flex-shrink-0">
                {s.total_own_goals > 0 && (
                  <span className="label-caps text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,107,0,0.15)', color: '#fb923c' }}>
                    {s.total_own_goals} аг
                  </span>
                )}
                {s.total_yellow > 0 && <span className="text-xs">🟨 {s.total_yellow}</span>}
                {s.total_red > 0 && <span className="text-xs">🟥 {s.total_red}</span>}
                <div
                  className="text-2xl font-black w-9 text-right"
                  style={{ color: isTop ? 'var(--color-brand-gold)' : 'var(--color-brand-text)', fontFamily: 'var(--font-sans)' }}
                >
                  {s.total_goals}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
