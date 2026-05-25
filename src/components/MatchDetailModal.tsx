import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import type { Match, TeamWithPlayers } from '../types/database'
import { supabase } from '../lib/supabase'

interface Props {
  match: Match
  teamA: TeamWithPlayers
  teamB: TeamWithPlayers
  onClose: () => void
}

interface PlayerStatRow {
  id: string
  player_id: string
  goals: number
  own_goals: number
  yellow_cards: number
  red_cards: number
  player_name: string
  player_number: number | null
  player_photo: string | null
  player_team_id: string
}

function TeamLogo({
  team,
  size = 64,
  isGlowing,
}: {
  team: TeamWithPlayers
  size?: number
  isGlowing: boolean
}) {
  const initials = team.name
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden font-bold text-sm"
      style={{
        width: size,
        height: size,
        background: team.color ? `${team.color}33` : 'rgba(255,255,255,0.08)',
        border: `3px solid ${team.color ?? 'rgba(255,255,255,0.15)'}`,
        color: team.color ?? 'var(--color-brand-primary)',
        boxShadow: isGlowing
          ? `0 0 24px ${team.color ?? 'rgba(122,219,138,0.4)'}55`
          : 'none',
      }}
    >
      {team.logo_url ? (
        <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
      ) : (
        initials
      )}
    </div>
  )
}

function PlayerStatLine({ stat }: { stat: PlayerStatRow }) {
  const initials = stat.player_name
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      className="flex items-center gap-2 p-2 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.04)' }}
    >
      {/* Photo */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0
                   overflow-hidden text-[10px] font-bold"
        style={{
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
          color: 'var(--color-brand-outline)',
        }}
      >
        {stat.player_photo ? (
          <img
            src={stat.player_photo}
            alt={stat.player_name}
            className="w-full h-full object-cover"
          />
        ) : (
          initials
        )}
      </div>

      {/* Name + events */}
      <div className="flex-1 min-w-0">
        <p
          className="text-[11px] font-semibold truncate"
          style={{ color: 'var(--color-brand-text)' }}
        >
          {stat.player_number != null ? `#${stat.player_number} ` : ''}
          {stat.player_name.split(' ')[0]}
        </p>
        <div className="flex items-center gap-0.5 mt-0.5 flex-wrap">
          {Array.from({ length: stat.goals }).map((_, i) => (
            <span key={`g${i}`} className="text-[12px]">⚽</span>
          ))}
          {Array.from({ length: stat.own_goals }).map((_, i) => (
            <span key={`og${i}`} className="text-[12px]" title="Автогол">🔴</span>
          ))}
          {Array.from({ length: stat.yellow_cards }).map((_, i) => (
            <span key={`yc${i}`} className="text-[12px]">🟨</span>
          ))}
          {Array.from({ length: stat.red_cards }).map((_, i) => (
            <span key={`rc${i}`} className="text-[12px]">🟥</span>
          ))}
        </div>
      </div>
    </div>
  )
}

export function MatchDetailModal({ match, teamA, teamB, onClose }: Props) {
  const [stats, setStats] = useState<PlayerStatRow[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      const { data, error } = await (supabase as any)
        .from('match_player_stats')
        .select('*, players(name, number, photo_url, team_id)')
        .eq('match_id', match.id)

      if (!error && data) {
        const rows: PlayerStatRow[] = (data as any[]).map(row => ({
          id: row.id,
          player_id: row.player_id,
          goals: row.goals ?? 0,
          own_goals: row.own_goals ?? 0,
          yellow_cards: row.yellow_cards ?? 0,
          red_cards: row.red_cards ?? 0,
          player_name: row.players?.name ?? 'Неизвестный',
          player_number: row.players?.number ?? null,
          player_photo: row.players?.photo_url ?? null,
          player_team_id: row.players?.team_id ?? '',
        }))
        setStats(rows)
      }
      setLoading(false)
    }
    fetchStats()
  }, [match.id])

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Swipe-down to close
  const touchStartY = useRef<number>(0)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientY - touchStartY.current
    if (delta > 80) onClose()
  }

  const sA = match.score_a ?? 0
  const sB = match.score_b ?? 0
  const winA = sA > sB
  const winB = sB > sA

  const statsA = stats.filter(
    s =>
      s.player_team_id === teamA.id &&
      s.goals + s.own_goals + s.yellow_cards + s.red_cards > 0
  )
  const statsB = stats.filter(
    s =>
      s.player_team_id === teamB.id &&
      s.goals + s.own_goals + s.yellow_cards + s.red_cards > 0
  )
  const hasStats = statsA.length > 0 || statsB.length > 0

  return (
    <>
      <style>{`
        @keyframes matchFadeIn {
          from { opacity: 0 }
          to   { opacity: 1 }
        }
        @keyframes matchSlideUp {
          from { opacity: 0; transform: translateY(50px) }
          to   { opacity: 1; transform: translateY(0) }
        }
        .match-modal-overlay { animation: matchFadeIn 0.2s ease forwards; }
        .match-modal-card    { animation: matchSlideUp 0.32s cubic-bezier(0.22,1,0.36,1) forwards; }
      `}</style>

      {/* Backdrop */}
      <div
        className="match-modal-overlay fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
        style={{
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          background: 'rgba(0,0,0,0.75)',
        }}
        onClick={onClose}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Modal card */}
        <div
          className="match-modal-card w-full sm:max-w-lg max-h-[90vh] overflow-y-auto
                     rounded-t-3xl sm:rounded-3xl"
          style={{
            background: 'var(--color-brand-surface)',
            border: '1px solid rgba(255,255,255,0.09)',
            boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Drag handle (mobile) */}
          <div className="flex justify-center pt-3 pb-0 sm:hidden">
            <div
              className="w-10 h-1 rounded-full"
              style={{ background: 'rgba(255,255,255,0.18)' }}
            />
          </div>

          {/* ── Score header ── */}
          <div className="px-5 pt-4 pb-5">
            {/* Close button row */}
            <div className="flex justify-end mb-1">
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center
                           transition-all hover:bg-white/10 active:scale-90"
                style={{ color: 'var(--color-brand-outline)' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Teams + big score */}
            <div className="flex items-center gap-2">
              {/* Team A */}
              <div className="flex-1 flex flex-col items-center gap-2">
                <TeamLogo team={teamA} isGlowing={winA} />
                <p
                  className="text-xs font-semibold text-center leading-tight px-1"
                  style={{
                    color: winA
                      ? 'var(--color-brand-primary)'
                      : 'var(--color-brand-text)',
                    opacity: winB ? 0.6 : 1,
                  }}
                >
                  {teamA.name}
                </p>
              </div>

              {/* Score */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <span
                  className="text-5xl font-black tabular-nums"
                  style={{
                    color: winA
                      ? 'var(--color-brand-primary)'
                      : winB
                      ? '#ef4444'
                      : 'var(--color-brand-text)',
                  }}
                >
                  {sA}
                </span>
                <span
                  className="text-2xl font-light mx-0.5"
                  style={{ color: 'var(--color-brand-outline)' }}
                >
                  :
                </span>
                <span
                  className="text-5xl font-black tabular-nums"
                  style={{
                    color: winB
                      ? 'var(--color-brand-primary)'
                      : winA
                      ? '#ef4444'
                      : 'var(--color-brand-text)',
                  }}
                >
                  {sB}
                </span>
              </div>

              {/* Team B */}
              <div className="flex-1 flex flex-col items-center gap-2">
                <TeamLogo team={teamB} isGlowing={winB} />
                <p
                  className="text-xs font-semibold text-center leading-tight px-1"
                  style={{
                    color: winB
                      ? 'var(--color-brand-primary)'
                      : 'var(--color-brand-text)',
                    opacity: winA ? 0.6 : 1,
                  }}
                >
                  {teamB.name}
                </p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />

          {/* ── Stats section ── */}
          <div className="px-4 py-4">
            {loading ? (
              <div className="py-10 flex justify-center">
                <div
                  className="w-7 h-7 border-2 rounded-full animate-spin"
                  style={{
                    borderColor: 'rgba(122,219,138,0.25)',
                    borderTopColor: 'var(--color-brand-primary)',
                  }}
                />
              </div>
            ) : !hasStats ? (
              <p
                className="text-center py-10 text-sm"
                style={{ color: 'var(--color-brand-text-muted)' }}
              >
                Детальная статистика не записана
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {/* Column A */}
                <div className="space-y-2">
                  <p
                    className="text-[10px] font-bold uppercase tracking-widest text-center mb-2"
                    style={{ color: 'var(--color-brand-text-muted)' }}
                  >
                    {teamA.name}
                  </p>
                  {statsA.length > 0 ? (
                    statsA.map(stat => <PlayerStatLine key={stat.id} stat={stat} />)
                  ) : (
                    <p
                      className="text-center text-sm py-4"
                      style={{ color: 'var(--color-brand-outline)' }}
                    >
                      —
                    </p>
                  )}
                </div>

                {/* Column B */}
                <div className="space-y-2">
                  <p
                    className="text-[10px] font-bold uppercase tracking-widest text-center mb-2"
                    style={{ color: 'var(--color-brand-text-muted)' }}
                  >
                    {teamB.name}
                  </p>
                  {statsB.length > 0 ? (
                    statsB.map(stat => <PlayerStatLine key={stat.id} stat={stat} />)
                  ) : (
                    <p
                      className="text-center text-sm py-4"
                      style={{ color: 'var(--color-brand-outline)' }}
                    >
                      —
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 pb-6 pt-1">
            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl font-bold text-sm transition-all
                         active:scale-95 hover:brightness-125"
              style={{
                background: 'rgba(255,255,255,0.07)',
                color: 'var(--color-brand-text)',
                border: '1px solid rgba(255,255,255,0.10)',
              }}
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
