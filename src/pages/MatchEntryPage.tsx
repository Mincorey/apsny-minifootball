/**
 * MatchEntryPage — страница ввода результата сыгранного матча (только для админа).
 *
 * Форма: дата (кастомный календарь) + время + команды + счёт + статистика игроков.
 * При сохранении INSERT-ит матч со status='played' и match_player_stats,
 * после чего Supabase VIEW 'standings' и 'top_scorers' пересчитываются автоматически.
 */

import { useState, useEffect, type FormEvent } from 'react'
import { Check, Loader2, Minus, Plus, ClipboardCheck, ChevronDown, ChevronUp } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useDialogs } from '../components/DialogsContext'
import { CustomCalendar } from '../components/CustomCalendar'
import { CustomSelect } from '../components/CustomSelect'
import { Empty } from '../components/ui/Empty'
import { Spinner } from '../components/Spinner'
import type { MatchPlayerStats } from '../types/database'

// ── Типы ──────────────────────────────────────────────────────────────────────

type PlayerStatEntry = {
  goals:        number
  own_goals:    number
  yellow_cards: number
  red_cards:    number
}

const emptyEntry = (): PlayerStatEntry => ({
  goals: 0, own_goals: 0, yellow_cards: 0, red_cards: 0,
})

// ── Счётчик голов (большой, для итогового счёта) ───────────────────────────────

interface ScoreCounterProps {
  value:     number
  onChange:  (v: number) => void
  teamName?: string
  teamColor?: string
}

function ScoreCounter({ value, onChange, teamName, teamColor }: ScoreCounterProps) {
  return (
    <div className="flex flex-col items-center gap-2 flex-1">
      <div className="h-6 flex items-center gap-1.5 mb-1">
        {teamColor && (
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: teamColor }} />
        )}
        {teamName ? (
          <span className="text-xs font-medium truncate max-w-[100px] sm:max-w-[130px]"
            style={{ color: 'var(--color-brand-text-muted)' }}>
            {teamName}
          </span>
        ) : (
          <span className="text-xs italic" style={{ color: 'var(--color-brand-outline)' }}>не выбрана</span>
        )}
      </div>
      <button type="button" onClick={() => onChange(value + 1)}
        className="w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-90"
        style={{ background: 'rgba(0,117,49,0.20)', color: 'var(--color-brand-primary)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,117,49,0.38)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,117,49,0.20)')}>
        <Plus size={18} />
      </button>
      <span className="text-6xl font-black w-20 text-center leading-none"
        style={{ color: 'var(--color-brand-text)', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </span>
      <button type="button" onClick={() => onChange(Math.max(0, value - 1))}
        className="w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-90"
        style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--color-brand-text-muted)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}>
        <Minus size={18} />
      </button>
    </div>
  )
}

// ── Мини-счётчик для статистики игроков ────────────────────────────────────────

function MiniCounter({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={() => onChange(Math.max(0, value - 1))}
        className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors"
        style={{ background: 'rgba(255,255,255,0.07)', color: 'var(--color-brand-text-muted)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}>
        <Minus size={10} />
      </button>
      <span className="w-5 text-center text-sm font-bold tabular-nums"
        style={{ color: value > 0 ? 'var(--color-brand-text)' : 'var(--color-brand-outline)' }}>
        {value}
      </span>
      <button type="button" onClick={() => onChange(value + 1)}
        className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors"
        style={{ background: 'rgba(255,255,255,0.07)', color: 'var(--color-brand-text-muted)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}>
        <Plus size={10} />
      </button>
    </div>
  )
}

// ── Строка статистики одного игрока ────────────────────────────────────────────

interface PlayerRowProps {
  name:     string
  number?:  number | null
  stats:    PlayerStatEntry
  onChange: (field: keyof PlayerStatEntry, val: number) => void
}

function PlayerStatRow({ name, number: num, stats, onChange }: PlayerRowProps) {
  const hasStats = stats.goals + stats.own_goals + stats.yellow_cards + stats.red_cards > 0

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-xl transition-colors"
      style={{ background: hasStats ? 'rgba(0,117,49,0.07)' : 'rgba(255,255,255,0.02)' }}
    >
      {/* Номер + имя */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {num != null && (
          <span className="label-caps text-[9px] w-5 text-center flex-shrink-0"
            style={{ color: 'var(--color-brand-outline)' }}>
            {num}
          </span>
        )}
        <span className="text-sm truncate"
          style={{ color: hasStats ? 'var(--color-brand-text)' : 'var(--color-brand-text-muted)', fontWeight: hasStats ? 600 : 400 }}>
          {name}
        </span>
      </div>

      {/* Счётчики */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[9px] leading-none" style={{ color: 'var(--color-brand-outline)' }}>⚽</span>
          <MiniCounter value={stats.goals}        onChange={v => onChange('goals', v)} />
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[9px] leading-none" style={{ color: 'var(--color-brand-outline)' }}>АГ</span>
          <MiniCounter value={stats.own_goals}    onChange={v => onChange('own_goals', v)} />
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[9px] leading-none">🟨</span>
          <MiniCounter value={stats.yellow_cards} onChange={v => onChange('yellow_cards', v)} />
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[9px] leading-none">🟥</span>
          <MiniCounter value={stats.red_cards}    onChange={v => onChange('red_cards', v)} />
        </div>
      </div>
    </div>
  )
}

// ── Главный компонент ──────────────────────────────────────────────────────────

interface Props {
  leagueName?: string
  seasonName?: string
}

export function MatchEntryPage({ leagueName, seasonName }: Props) {
  const {
    teams,
    selectedLeague,
    loadingTeams,
    matches,
    createPlayedMatch,
  } = useData()

  const { showToast } = useDialogs()

  // ── State формы ─────────────────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [hour,    setHour]    = useState(12)
  const [minute,  setMinute]  = useState(0)
  const [teamAId, setTeamAId] = useState('')
  const [teamBId, setTeamBId] = useState('')
  const [scoreA,  setScoreA]  = useState(0)
  const [scoreB,  setScoreB]  = useState(0)

  // ── Статистика игроков ───────────────────────────────────────────────────────
  const [showStats,  setShowStats]  = useState(false)
  const [statsA, setStatsA] = useState<Record<string, PlayerStatEntry>>({})
  const [statsB, setStatsB] = useState<Record<string, PlayerStatEntry>>({})

  // ── Сброс статистики при смене команды ────────────────────────────────────────
  useEffect(() => {
    const teamA = teams.find(t => t.id === teamAId)
    if (teamA) {
      setStatsA(Object.fromEntries(teamA.players.map(p => [p.id, emptyEntry()])))
    } else {
      setStatsA({})
    }
  }, [teamAId, teams])

  useEffect(() => {
    const teamB = teams.find(t => t.id === teamBId)
    if (teamB) {
      setStatsB(Object.fromEntries(teamB.players.map(p => [p.id, emptyEntry()])))
    } else {
      setStatsB({})
    }
  }, [teamBId, teams])

  const [saving,  setSaving]  = useState(false)
  const [success, setSuccess] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  // ── Guards ───────────────────────────────────────────────────────────────────
  if (!selectedLeague) return <Empty text="Выберите лигу" />
  if (loadingTeams)    return <Spinner className="py-20" />

  // ── Производные данные ───────────────────────────────────────────────────────
  const teamA     = teams.find(t => t.id === teamAId) ?? null
  const teamB     = teams.find(t => t.id === teamBId) ?? null
  const teamsForB = teams.filter(t => t.id !== teamAId)

  // Голы по статистике (для проверки соответствия счёту)
  const statGoalsA =
    Object.values(statsA).reduce((s, p) => s + p.goals, 0) +
    Object.values(statsB).reduce((s, p) => s + p.own_goals, 0)
  const statGoalsB =
    Object.values(statsB).reduce((s, p) => s + p.goals, 0) +
    Object.values(statsA).reduce((s, p) => s + p.own_goals, 0)
  const mismatch = showStats && teamA && teamB &&
    (statGoalsA !== scoreA || statGoalsB !== scoreB)

  // Последние сыгранные матчи
  const recentPlayed = matches
    .filter(m => m.status === 'played')
    .sort((a, b) => (b.played_at ?? b.created_at).localeCompare(a.played_at ?? a.created_at))
    .slice(0, 6)

  // ── Форматирование ───────────────────────────────────────────────────────────
  const formatDate = (d: Date) =>
    d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

  // ── Опции для CustomSelect ────────────────────────────────────────────────────
  const hourOptions   = Array.from({ length: 24 }, (_, i) => ({ value: i, label: String(i).padStart(2, '0') }))
  const minuteOptions = [0,5,10,15,20,25,30,35,40,45,50,55].map(m => ({ value: m, label: String(m).padStart(2, '0') }))

  // ── Обработка отправки ───────────────────────────────────────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!teamAId || !teamBId) { setError('Выберите обе команды'); return }
    if (teamAId === teamBId)  { setError('Команды не могут быть одинаковыми'); return }

    setSaving(true)

    const playedAt = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      hour, minute, 0,
    ).toISOString()

    // Собираем статистику (только ненулевые записи)
    const stats: Omit<MatchPlayerStats, 'id' | 'match_id'>[] = []
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

    const result = await createPlayedMatch({
      leagueId: selectedLeague.id,
      teamAId, teamBId, scoreA, scoreB, playedAt,
      stats,
    })

    setSaving(false)

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      const winner =
        scoreA > scoreB ? teamA?.name :
        scoreB > scoreA ? teamB?.name : null
      const msg = winner
        ? `✅ Победа ${winner}! Счёт ${scoreA}:${scoreB}. Таблица обновлена.`
        : `✅ Ничья ${scoreA}:${scoreB}. Таблица обновлена.`
      showToast(msg, 'success', 4000)

      setTimeout(() => {
        setSuccess(false)
        setScoreA(0); setScoreB(0)
        setTeamAId(''); setTeamBId('')
        setShowStats(false)
      }, 2000)
    }
  }

  // ── Стиль карточки ────────────────────────────────────────────────────────────
  const cardStyle: React.CSSProperties = {
    background:   'rgba(255,255,255,0.03)',
    border:       '1px solid rgba(255,255,255,0.07)',
    borderRadius: '1rem',
    padding:      '1rem',
  }

  // ── Рендер ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* Заголовок */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: 'rgba(0,117,49,0.20)', color: 'var(--color-brand-primary)' }}>
          <ClipboardCheck size={20} />
        </div>
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold" style={{ color: 'var(--color-brand-text)' }}>
            Ввод результата матча
          </h2>
          {(seasonName || leagueName) && (
            <p className="mt-0.5 text-sm" style={{ color: 'var(--color-brand-text-muted)' }}>
              {seasonName}{seasonName && leagueName ? ' • ' : ''}{leagueName}
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ═══ СЕТКА: Дата/Время + Команды/Счёт ═══════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* ЛЕВАЯ — Дата и время */}
          <div className="space-y-4">

            <div style={cardStyle}>
              <div className="label-caps text-[10px] mb-2" style={{ color: 'var(--color-brand-outline)' }}>
                📅 Дата матча
              </div>
              <div className="text-sm font-semibold mb-3" style={{ color: 'var(--color-brand-primary)' }}>
                {formatDate(selectedDate)}
              </div>
              <CustomCalendar value={selectedDate} onChange={setSelectedDate} />
            </div>

            <div style={cardStyle}>
              <div className="label-caps text-[10px] mb-3" style={{ color: 'var(--color-brand-outline)' }}>
                ⏰ Время начала
              </div>
              <div className="flex items-center gap-3">
                <CustomSelect value={hour}   onChange={v => setHour(v as number)}   options={hourOptions}   className="flex-1" />
                <span className="text-2xl font-black flex-shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }}>:</span>
                <CustomSelect value={minute} onChange={v => setMinute(v as number)} options={minuteOptions} className="flex-1" />
              </div>
            </div>
          </div>

          {/* ПРАВАЯ — Команды и счёт */}
          <div className="space-y-4">

            {/* Выбор команд */}
            <div style={cardStyle}>
              <div className="label-caps text-[10px] mb-3" style={{ color: 'var(--color-brand-outline)' }}>
                ⚽ Команды
              </div>

              <div className="mb-3">
                <label className="block text-xs mb-1.5" style={{ color: 'var(--color-brand-text-muted)' }}>
                  Команда 1 (хозяева)
                </label>
                <CustomSelect
                  value={teamAId}
                  onChange={v => {
                    const val = String(v)
                    setTeamAId(val)
                    if (val === teamBId) setTeamBId('')
                  }}
                  options={teams.map(t => ({ value: t.id, label: t.name, color: t.color }))}
                  placeholder="— Выберите команду —"
                  accentColor={teamA?.color}
                />
              </div>

              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--color-brand-text-muted)' }}>
                  Команда 2 (гости)
                </label>
                <CustomSelect
                  value={teamBId}
                  onChange={v => setTeamBId(String(v))}
                  options={teamsForB.map(t => ({ value: t.id, label: t.name, color: t.color }))}
                  placeholder="— Выберите команду —"
                  accentColor={teamB?.color}
                />
              </div>
            </div>

            {/* Счёт */}
            <div style={cardStyle}>
              <div className="label-caps text-[10px] mb-4 text-center" style={{ color: 'var(--color-brand-outline)' }}>
                Счёт матча
              </div>
              <div className="flex items-start justify-center gap-2">
                <ScoreCounter value={scoreA} onChange={setScoreA} teamName={teamA?.name} teamColor={teamA?.color} />
                <div className="text-4xl font-black mt-10 flex-shrink-0 w-8 text-center" style={{ color: 'rgba(255,255,255,0.18)' }}>:</div>
                <ScoreCounter value={scoreB} onChange={setScoreB} teamName={teamB?.name} teamColor={teamB?.color} />
              </div>

              {teamA && teamB && (
                <div className="mt-4 text-center text-xs rounded-lg py-2 px-3"
                  style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--color-brand-outline)' }}>
                  {scoreA > scoreB
                    ? <><span style={{ color: 'var(--color-brand-primary)' }}>{teamA.name}</span> побеждает</>
                    : scoreB > scoreA
                      ? <><span style={{ color: 'var(--color-brand-primary)' }}>{teamB.name}</span> побеждает</>
                      : <span style={{ color: 'var(--color-brand-gold)' }}>Ничья</span>
                  }
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══ СТАТИСТИКА ИГРОКОВ (полная ширина, сворачивается) ══════════════ */}
        {teamA && teamB && (
          <div
            style={{
              background:   'rgba(255,255,255,0.03)',
              border:       '1px solid rgba(255,255,255,0.07)',
              borderRadius: '1rem',
              overflow:     'hidden',
            }}
          >
            {/* Кнопка-аккордеон */}
            <button
              type="button"
              onClick={() => setShowStats(v => !v)}
              className="w-full flex items-center gap-3 px-4 py-3.5 transition-colors"
              style={{ color: 'var(--color-brand-text-muted)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span className="text-sm font-semibold flex-1 text-left">
                ⚽ Статистика игроков (голы, карточки)
              </span>
              <span className="label-caps text-[9px] px-2 py-0.5 rounded"
                style={{ background: 'rgba(0,117,49,0.15)', color: 'var(--color-brand-primary)' }}>
                опционально
              </span>
              {showStats
                ? <ChevronUp  size={15} style={{ flexShrink: 0 }} />
                : <ChevronDown size={15} style={{ flexShrink: 0 }} />
              }
            </button>

            {showStats && (
              <div
                className="px-4 pb-4 space-y-4"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
              >

                {/* Предупреждение о расхождении голов */}
                {mismatch && (
                  <div className="mt-3 rounded-xl px-3 py-2 text-xs"
                    style={{ background: 'rgba(251,146,60,0.10)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.20)' }}>
                    ⚠️ По статистике: {statGoalsA}:{statGoalsB}, введённый счёт: {scoreA}:{scoreB}. Проверьте данные.
                  </div>
                )}

                {/* Легенда */}
                <div className="flex items-center gap-4 pt-3">
                  {['⚽ голы', 'АГ автоголы', '🟨 жёлтая', '🟥 красная'].map(l => (
                    <span key={l} className="text-[10px]" style={{ color: 'var(--color-brand-outline)' }}>{l}</span>
                  ))}
                </div>

                {/* Игроки команды A */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: teamA.color }} />
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-brand-text-muted)' }}>
                      {teamA.name}
                    </span>
                    {Object.values(statsA).some(s => s.goals > 0) && (
                      <span className="label-caps text-[9px] px-1.5 rounded"
                        style={{ background: 'rgba(0,117,49,0.15)', color: 'var(--color-brand-primary)' }}>
                        {Object.values(statsA).reduce((s, p) => s + p.goals, 0)} г
                      </span>
                    )}
                  </div>
                  {teamA.players.length === 0 ? (
                    <p className="text-xs py-2 px-3 rounded-lg"
                      style={{ color: 'var(--color-brand-outline)', background: 'rgba(255,255,255,0.02)' }}>
                      Нет игроков — добавьте их в разделе «Управление»
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {teamA.players.map(p => (
                        <PlayerStatRow
                          key={p.id}
                          name={p.name}
                          number={p.number}
                          stats={statsA[p.id] ?? emptyEntry()}
                          onChange={(field, val) =>
                            setStatsA(prev => ({ ...prev, [p.id]: { ...(prev[p.id] ?? emptyEntry()), [field]: val } }))
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Игроки команды B */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: teamB.color }} />
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-brand-text-muted)' }}>
                      {teamB.name}
                    </span>
                    {Object.values(statsB).some(s => s.goals > 0) && (
                      <span className="label-caps text-[9px] px-1.5 rounded"
                        style={{ background: 'rgba(0,117,49,0.15)', color: 'var(--color-brand-primary)' }}>
                        {Object.values(statsB).reduce((s, p) => s + p.goals, 0)} г
                      </span>
                    )}
                  </div>
                  {teamB.players.length === 0 ? (
                    <p className="text-xs py-2 px-3 rounded-lg"
                      style={{ color: 'var(--color-brand-outline)', background: 'rgba(255,255,255,0.02)' }}>
                      Нет игроков — добавьте их в разделе «Управление»
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {teamB.players.map(p => (
                        <PlayerStatRow
                          key={p.id}
                          name={p.name}
                          number={p.number}
                          stats={statsB[p.id] ?? emptyEntry()}
                          onChange={(field, val) =>
                            setStatsB(prev => ({ ...prev, [p.id]: { ...(prev[p.id] ?? emptyEntry()), [field]: val } }))
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ ОШИБКА + КНОПКА СОХРАНИТЬ ══════════════════════════════════════ */}

        {error && (
          <div className="rounded-xl px-4 py-3 text-sm"
            style={{ background: 'rgba(239,68,68,0.10)', color: '#f87171', border: '1px solid rgba(239,68,68,0.20)' }}>
            ⚠️ {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving || success}
          className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          style={success ? {
            background: 'rgba(122,219,138,0.15)',
            color:      'var(--color-brand-primary)',
            border:     '1px solid rgba(122,219,138,0.25)',
          } : {
            background: 'var(--color-brand-accent)',
            color:      '#fff',
            boxShadow:  '0 0 24px rgba(0,117,49,0.35)',
          }}
        >
          {success ? (
            <><Check size={18} /> Результат сохранён! Таблица обновлена</>
          ) : saving ? (
            <><Loader2 size={18} className="animate-spin" /> Сохранение...</>
          ) : (
            'Сохранить результат матча'
          )}
        </button>
      </form>

      {/* ── История последних матчей ───────────────────────────────────────── */}
      {recentPlayed.length > 0 && (
        <div style={{ ...cardStyle, marginTop: '1.5rem' }}>
          <div className="label-caps text-[10px] mb-3" style={{ color: 'var(--color-brand-outline)' }}>
            📋 Последние записанные матчи
          </div>
          <div className="space-y-2">
            {recentPlayed.map(m => {
              const tA = teams.find(t => t.id === m.team_a_id)
              const tB = teams.find(t => t.id === m.team_b_id)
              if (!tA || !tB) return null

              const date = m.played_at
                ? new Date(m.played_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
                : '—'
              const winA = (m.score_a ?? 0) > (m.score_b ?? 0)
              const winB = (m.score_b ?? 0) > (m.score_a ?? 0)

              return (
                <div key={m.id} className="flex items-center gap-2 py-2 px-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.025)' }}>
                  <span className="label-caps text-[9px] flex-shrink-0 w-14"
                    style={{ color: 'var(--color-brand-outline)' }}>
                    {date}
                  </span>
                  <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                    <span className="text-xs truncate"
                      style={{ color: winA ? 'var(--color-brand-primary)' : 'var(--color-brand-text-muted)', fontWeight: winA ? 700 : 400 }}>
                      {tA.name}
                    </span>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: tA.color }} />
                  </div>
                  <div className="text-sm font-black flex-shrink-0 px-2 tabular-nums"
                    style={{ color: 'var(--color-brand-text)' }}>
                    {m.score_a} : {m.score_b}
                  </div>
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: tB.color }} />
                    <span className="text-xs truncate"
                      style={{ color: winB ? 'var(--color-brand-primary)' : 'var(--color-brand-text-muted)', fontWeight: winB ? 700 : 400 }}>
                      {tB.name}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
