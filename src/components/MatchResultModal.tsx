/**
 * MatchResultModal — модалка ввода результата матча.
 * Открывается из AdminPanel при нажатии на запланированный матч.
 * Позволяет ввести счёт и голы/карточки игроков (опционально).
 */

import { useState, type FormEvent } from 'react'
import { X, Minus, Plus, Loader2, Check } from 'lucide-react'
import type { Match, TeamWithPlayers, Player } from '../types/database'
import { useData, type SaveMatchResultArgs } from '../context/DataContext'

interface Props {
  match:  Match
  teamA:  TeamWithPlayers
  teamB:  TeamWithPlayers
  onClose: () => void
}

// Счётчик +/-
function Counter({
  value,
  onChange,
  min = 0,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
      >
        <Minus size={10} />
      </button>
      <span className="w-5 text-center text-sm font-mono font-bold">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
      >
        <Plus size={10} />
      </button>
    </div>
  )
}

// Строка игрока в таблице статистики
function PlayerStatRow({
  player,
  stats,
  onChange,
}: {
  player: Player
  stats: { goals: number; own_goals: number; yellow_cards: number; red_cards: number }
  onChange: (field: keyof typeof stats, val: number) => void
}) {
  const hasStats = stats.goals + stats.own_goals + stats.yellow_cards + stats.red_cards > 0

  return (
    <div className={`flex items-center gap-2 py-2 px-2 rounded-lg transition ${hasStats ? 'bg-white/5' : ''}`}>
      <span className="flex-1 text-sm text-gray-300 truncate min-w-0">{player.name}</span>
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-0.5">⚽</div>
          <Counter value={stats.goals} onChange={v => onChange('goals', v)} />
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-0.5">АГ</div>
          <Counter value={stats.own_goals} onChange={v => onChange('own_goals', v)} />
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-0.5">🟨</div>
          <Counter value={stats.yellow_cards} onChange={v => onChange('yellow_cards', v)} />
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-0.5">🟥</div>
          <Counter value={stats.red_cards} onChange={v => onChange('red_cards', v)} />
        </div>
      </div>
    </div>
  )
}

type PlayerStats = { goals: number; own_goals: number; yellow_cards: number; red_cards: number }

export function MatchResultModal({ match, teamA, teamB, onClose }: Props) {
  const { saveMatchResult } = useData()

  const [scoreA, setScoreA] = useState(match.score_a ?? 0)
  const [scoreB, setScoreB] = useState(match.score_b ?? 0)
  const [saving,  setSaving]  = useState(false)
  const [success, setSuccess] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [showStats, setShowStats] = useState(false)

  // Статистика: Map<playerId, stats>
  const emptyStats = (): PlayerStats => ({ goals: 0, own_goals: 0, yellow_cards: 0, red_cards: 0 })

  const [statsA, setStatsA] = useState<Record<string, PlayerStats>>(() =>
    Object.fromEntries(teamA.players.map(p => [p.id, emptyStats()]))
  )
  const [statsB, setStatsB] = useState<Record<string, PlayerStats>>(() =>
    Object.fromEntries(teamB.players.map(p => [p.id, emptyStats()]))
  )

  function updateStat(
    setter: typeof setStatsA,
    playerId: string,
    field: keyof PlayerStats,
    val: number
  ) {
    setter(prev => ({ ...prev, [playerId]: { ...prev[playerId], [field]: val } }))
  }

  // Итоговые голы из статистики vs введённый счёт
  const sumGoals = (map: Record<string, PlayerStats>) =>
    Object.values(map).reduce((s, p) => s + p.goals + p.own_goals, 0)

  const statsGoalsA = Object.values(statsA).reduce((s, p) => s + p.goals, 0) +
                      Object.values(statsB).reduce((s, p) => s + p.own_goals, 0)
  const statsGoalsB = Object.values(statsB).reduce((s, p) => s + p.goals, 0) +
                      Object.values(statsA).reduce((s, p) => s + p.own_goals, 0)

  const scoreMismatch = showStats && (statsGoalsA !== scoreA || statsGoalsB !== scoreB)

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    // Собираем только строки с ненулевой статистикой
    const stats: SaveMatchResultArgs['stats'] = []
    if (showStats) {
      for (const [playerId, s] of Object.entries(statsA)) {
        if (s.goals + s.own_goals + s.yellow_cards + s.red_cards > 0)
          stats.push({ player_id: playerId, ...s })
      }
      for (const [playerId, s] of Object.entries(statsB)) {
        if (s.goals + s.own_goals + s.yellow_cards + s.red_cards > 0)
          stats.push({ player_id: playerId, ...s })
      }
    }

    const result = await saveMatchResult({
      matchId:  match.id,
      scoreA,
      scoreB,
      playedAt: new Date().toISOString(),
      stats,
    })

    setSaving(false)
    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      setTimeout(onClose, 1000)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm overflow-y-auto py-6"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-gray-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg mx-4">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="font-bold text-white">Ввод результата · Тур {match.tour}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition p-1 rounded-lg hover:bg-white/10">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          {/* Счёт */}
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              {/* Команда A */}
              <div className="flex-1 text-right">
                <div className="flex items-center justify-end gap-2">
                  <span className="font-semibold text-white text-sm">{teamA.name}</span>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: teamA.color }} />
                </div>
              </div>

              {/* Счёт */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex flex-col items-center gap-1">
                  <button type="button" onClick={() => setScoreA(s => s + 1)}
                    className="w-8 h-8 rounded-full bg-green-600/20 hover:bg-green-600/40 flex items-center justify-center transition">
                    <Plus size={14} />
                  </button>
                  <span className="text-3xl font-black text-white w-10 text-center">{scoreA}</span>
                  <button type="button" onClick={() => setScoreA(s => Math.max(0, s - 1))}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition">
                    <Minus size={14} />
                  </button>
                </div>

                <span className="text-2xl font-black text-gray-500">:</span>

                <div className="flex flex-col items-center gap-1">
                  <button type="button" onClick={() => setScoreB(s => s + 1)}
                    className="w-8 h-8 rounded-full bg-green-600/20 hover:bg-green-600/40 flex items-center justify-center transition">
                    <Plus size={14} />
                  </button>
                  <span className="text-3xl font-black text-white w-10 text-center">{scoreB}</span>
                  <button type="button" onClick={() => setScoreB(s => Math.max(0, s - 1))}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition">
                    <Minus size={14} />
                  </button>
                </div>
              </div>

              {/* Команда B */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: teamB.color }} />
                  <span className="font-semibold text-white text-sm">{teamB.name}</span>
                </div>
              </div>
            </div>

            {/* Тоггл статистики */}
            <button
              type="button"
              onClick={() => setShowStats(v => !v)}
              className="w-full text-sm text-gray-400 hover:text-white transition py-2 border border-white/10 hover:border-white/20 rounded-xl"
            >
              {showStats ? '▲ Скрыть статистику игроков' : '▼ Добавить голы и карточки'}
            </button>
          </div>

          {/* Статистика игроков */}
          {showStats && (
            <div className="px-5 pb-4 space-y-4 border-t border-white/5">
              {/* Несовпадение счёта */}
              {scoreMismatch && (
                <div className="mt-4 text-xs text-orange-400 bg-orange-400/10 rounded-xl px-3 py-2">
                  ⚠️ Голы по статистике ({statsGoalsA}:{statsGoalsB}) не совпадают со счётом ({scoreA}:{scoreB})
                </div>
              )}

              {/* Команда A */}
              <div className="mt-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: teamA.color }} />
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{teamA.name}</span>
                  <span className="text-xs text-gray-600">({sumGoals(statsA)} г.)</span>
                </div>
                {teamA.players.map(p => (
                  <PlayerStatRow
                    key={p.id}
                    player={p}
                    stats={statsA[p.id]}
                    onChange={(f, v) => updateStat(setStatsA, p.id, f, v)}
                  />
                ))}
              </div>

              {/* Команда B */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: teamB.color }} />
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{teamB.name}</span>
                  <span className="text-xs text-gray-600">({sumGoals(statsB)} г.)</span>
                </div>
                {teamB.players.map(p => (
                  <PlayerStatRow
                    key={p.id}
                    player={p}
                    stats={statsB[p.id]}
                    onChange={(f, v) => updateStat(setStatsB, p.id, f, v)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="p-5 border-t border-white/10 space-y-3">
            {error && (
              <p className="text-sm text-red-400 bg-red-400/10 rounded-xl px-3 py-2">{error}</p>
            )}
            <button
              type="submit"
              disabled={saving || success}
              className="w-full flex items-center justify-center gap-2 font-semibold rounded-xl py-3 transition
                         bg-green-600 hover:bg-green-500 disabled:opacity-60 disabled:cursor-not-allowed text-white"
            >
              {success
                ? <><Check size={18} /> Сохранено!</>
                : saving
                  ? <><Loader2 size={18} className="animate-spin" /> Сохранение...</>
                  : 'Сохранить результат'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
