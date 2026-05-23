/**
 * ScorersPage — таблица бомбардиров.
 *
 * Колонки: №, Игрок, Команда, М (матчи команды), Г (голы).
 * М берётся из standings (матчи сыгранные командой игрока).
 * Данные обновляются автоматически при вводе статистики матча.
 */

import { Users } from 'lucide-react'
import type { TopScorer } from '../types/database'
import { useData } from '../context/DataContext'
import { Spinner } from '../components/Spinner'
import { Empty } from '../components/ui/Empty'

interface Props {
  scorers: TopScorer[]
  loading: boolean
  error?: string | null
}

// Медальные цвета для топ-3
const MEDAL: Record<number, { color: string; bg: string; border: string; label: string }> = {
  0: { color: '#FFB800', bg: 'rgba(255,184,0,0.08)',   border: 'rgba(255,184,0,0.25)',   label: '\u{1F947}' },
  1: { color: 'rgba(255,255,255,0.55)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.15)', label: '\u{1F948}' },
  2: { color: 'var(--color-brand-primary)', bg: 'rgba(122,219,138,0.06)', border: 'rgba(122,219,138,0.18)', label: '\u{1F949}' },
}

export function ScorersPage({ scorers, loading, error }: Props) {
  const { standings } = useData()

  if (loading) return <Spinner className="py-20" />
  if (error)   return <Empty text={`❌ Ошибка: ${error}`} />

  const filtered = scorers.filter(s => s.total_goals > 0)
  if (!filtered.length) return <Empty text="Статистика голов пока не внесена" />

  // Карта: team_name -> matches played (из standings)
  const playedMap = new Map(standings.map(s => [s.team_name, s.played]))
  // Карта: team_name -> color (из standings)
  const colorMap  = new Map(standings.map(s => [s.team_name, s.color]))

  return (
    <div className="space-y-4">

      {/* Заголовок */}
      <h2 className="text-2xl sm:text-3xl font-extrabold" style={{ color: 'var(--color-brand-text)' }}>
        Бомбардиры
      </h2>

      {/* Таблица */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.07)' }}
      >

        {/* Шапка */}
        <div
          className="grid items-center px-3 sm:px-4 py-2.5"
          style={{
            gridTemplateColumns: '2rem 1fr 1fr 2.5rem 2.5rem',
            background:   'rgba(255,255,255,0.04)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <span className="label-caps text-[9px] text-center" style={{ color: 'var(--color-brand-outline)' }}>#</span>
          <span className="label-caps text-[9px]"             style={{ color: 'var(--color-brand-outline)' }}>Игрок</span>
          <span className="label-caps text-[9px]"             style={{ color: 'var(--color-brand-outline)' }}>Команда</span>
          <span className="label-caps text-[9px] text-center" style={{ color: 'var(--color-brand-outline)' }} title="Матчи сыграны командой">М</span>
          <span className="label-caps text-[9px] text-center font-bold" style={{ color: 'var(--color-brand-primary)' }} title="Голы">Г▼</span>
        </div>

        {/* Строки */}
        {filtered.map((s, i) => {
          const medal  = MEDAL[i] ?? null
          const played = playedMap.get(s.team_name) ?? 0
          const color  = colorMap.get(s.team_name)  ?? '#888888'

          return (
            <div
              key={s.player_id}
              className="grid items-center px-3 sm:px-4 py-3 transition-colors"
              style={{
                gridTemplateColumns: '2rem 1fr 1fr 2.5rem 2.5rem',
                background:   medal ? medal.bg : i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                borderLeft:   medal ? `3px solid ${medal.color}` : '3px solid transparent',
                cursor: 'default',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLDivElement
                el.style.background = 'rgba(255,255,255,0.055)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLDivElement
                el.style.background = medal ? medal.bg : i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'
              }}
            >
              {/* Позиция */}
              <div className="flex items-center justify-center">
                {medal ? (
                  <span className="text-base leading-none">{medal.label}</span>
                ) : (
                  <span className="font-mono text-xs font-bold" style={{ color: 'var(--color-brand-outline)' }}>
                    {i + 1}
                  </span>
                )}
              </div>

              {/* Игрок */}
              <div className="flex items-center gap-2 min-w-0 pr-2">
                {/* Аватар */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border:     medal ? `1.5px solid ${medal.color}44` : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {s.photo_url
                    ? <img src={s.photo_url} className="w-8 h-8 object-cover" alt="" />
                    : <Users size={13} style={{ color: 'var(--color-brand-outline)' }} />
                  }
                </div>

                <div className="min-w-0">
                  <div
                    className="text-sm font-semibold truncate leading-tight"
                    style={{ color: medal ? medal.color : 'var(--color-brand-text)' }}
                  >
                    {s.player_name}
                  </div>
                  {/* Карточки под именем */}
                  {(s.total_yellow > 0 || s.total_red > 0 || s.permanent_ban) && (
                    <div className="flex gap-1 mt-0.5">
                      {s.total_yellow > 0 && (
                        <span className="text-[10px] leading-none">{'\u{1F7E8}'}{s.total_yellow}</span>
                      )}
                      {s.total_red > 0 && (
                        <span className="text-[10px] leading-none">{'\u{1F7E5}'}{s.total_red}</span>
                      )}
                      {s.permanent_ban && (
                        <span className="label-caps text-[8px] px-1 rounded" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>БАН</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Команда */}
              <div className="flex items-center gap-1.5 min-w-0 pr-1">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs truncate" style={{ color: 'var(--color-brand-text-muted)' }}>
                  {s.team_name}
                </span>
              </div>

              {/* М — матчи */}
              <div className="text-center">
                <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--color-brand-text-muted)' }}>
                  {played}
                </span>
              </div>

              {/* Г — голы */}
              <div className="text-center">
                <span
                  className="text-xl font-black tabular-nums leading-none"
                  style={{ color: medal ? medal.color : 'var(--color-brand-text)' }}
                >
                  {s.total_goals}
                </span>
                {s.total_own_goals > 0 && (
                  <div className="label-caps text-[8px] mt-0.5" style={{ color: '#fb923c' }} title="Автоголы">
                    {s.total_own_goals}аг
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Легенда */}
      <div className="flex items-center gap-4 px-1">
        {[
          { label: 'М', desc: 'матчи сыграны командой' },
          { label: 'Г', desc: 'голы' },
        ].map(({ label, desc }) => (
          <div key={label} className="flex items-center gap-1">
            <span className="label-caps text-[9px] font-bold" style={{ color: 'var(--color-brand-primary)' }}>{label}</span>
            <span className="text-[10px]" style={{ color: 'var(--color-brand-outline)' }}>{'—'} {desc}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
