/**
 * MatchEntryPage — страница ввода результата сыгранного матча (только для админа).
 *
 * Форма: дата (кастомный календарь) + время + команды + счёт.
 * При сохранении INSERT-ит матч со status='played', после чего
 * Supabase VIEW 'standings' пересчитывается автоматически.
 */

import { useState, type FormEvent } from 'react'
import { Check, Loader2, Minus, Plus, ClipboardCheck } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useDialogs } from '../components/DialogsContext'
import { CustomCalendar } from '../components/CustomCalendar'
import { Empty } from '../components/ui/Empty'
import { Spinner } from '../components/Spinner'

// ── Вспомогательный счётчик голов ─────────────────────────────────────────────

interface ScoreCounterProps {
  value: number
  onChange: (v: number) => void
  teamName?: string
  teamColor?: string
}

function ScoreCounter({ value, onChange, teamName, teamColor }: ScoreCounterProps) {
  return (
    <div className="flex flex-col items-center gap-2 flex-1">
      {/* Команда */}
      <div className="h-6 flex items-center gap-1.5 mb-1">
        {teamColor && (
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: teamColor }} />
        )}
        {teamName ? (
          <span
            className="text-xs font-medium truncate max-w-[100px] sm:max-w-[130px]"
            style={{ color: 'var(--color-brand-text-muted)' }}
          >
            {teamName}
          </span>
        ) : (
          <span className="text-xs italic" style={{ color: 'var(--color-brand-outline)' }}>не выбрана</span>
        )}
      </div>

      {/* Кнопка + */}
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-90"
        style={{ background: 'rgba(0,117,49,0.20)', color: 'var(--color-brand-primary)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,117,49,0.38)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,117,49,0.20)')}
      >
        <Plus size={18} />
      </button>

      {/* Счёт */}
      <span
        className="text-6xl font-black w-20 text-center leading-none"
        style={{ color: 'var(--color-brand-text)', fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </span>

      {/* Кнопка − */}
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-90"
        style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--color-brand-text-muted)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
      >
        <Minus size={18} />
      </button>
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
  const [hour,   setHour]   = useState(12)
  const [minute, setMinute] = useState(0)
  const [teamAId, setTeamAId] = useState('')
  const [teamBId, setTeamBId] = useState('')
  const [scoreA, setScoreA] = useState(0)
  const [scoreB, setScoreB] = useState(0)

  const [saving,  setSaving]  = useState(false)
  const [success, setSuccess] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  // ── Производные данные ───────────────────────────────────────────────────────
  if (!selectedLeague) return <Empty text="Выберите лигу" />
  if (loadingTeams)    return <Spinner className="py-20" />

  const teamA     = teams.find(t => t.id === teamAId) ?? null
  const teamB     = teams.find(t => t.id === teamBId) ?? null
  const teamsForB = teams.filter(t => t.id !== teamAId)

  // Последние сыгранные матчи (для истории внизу)
  const recentPlayed = matches
    .filter(m => m.status === 'played')
    .sort((a, b) => (b.played_at ?? b.created_at).localeCompare(a.played_at ?? a.created_at))
    .slice(0, 6)

  // ── Форматирование даты ──────────────────────────────────────────────────────
  const formatDate = (d: Date) =>
    d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

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
      hour,
      minute,
      0,
    ).toISOString()

    const result = await createPlayedMatch({
      leagueId: selectedLeague.id,
      teamAId,
      teamBId,
      scoreA,
      scoreB,
      playedAt,
    })

    setSaving(false)

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      const winner =
        scoreA > scoreB ? teamA?.name :
        scoreB > scoreA ? teamB?.name :
        null
      const msg = winner
        ? `✅ Победа ${winner}! Счёт ${scoreA}:${scoreB}. Таблица обновлена.`
        : `✅ Ничья ${scoreA}:${scoreB}. Таблица обновлена.`
      showToast(msg, 'success', 4000)

      // Сброс формы через 2 секунды
      setTimeout(() => {
        setSuccess(false)
        setScoreA(0)
        setScoreB(0)
        setTeamAId('')
        setTeamBId('')
      }, 2000)
    }
  }

  // Стиль карточки-секции
  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border:     '1px solid rgba(255,255,255,0.07)',
    borderRadius: '1rem',
    padding: '1rem',
  }

  // Стиль select
  const selectStyle = (accentColor?: string | null): React.CSSProperties => ({
    background: 'rgba(255,255,255,0.06)',
    color:      'var(--color-brand-text)',
    border:     accentColor ? `1px solid ${accentColor}55` : '1px solid rgba(255,255,255,0.12)',
    borderRadius: '0.75rem',
    padding: '0.6rem 0.75rem',
    width: '100%',
    appearance: 'none' as const,
    cursor: 'pointer',
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'border-color 0.15s',
  })

  return (
    <div className="space-y-5">

      {/* ── Заголовок ─────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: 'rgba(0,117,49,0.20)', color: 'var(--color-brand-primary)' }}
        >
          <ClipboardCheck size={20} />
        </div>
        <div>
          <h2
            className="text-2xl sm:text-3xl font-extrabold"
            style={{ color: 'var(--color-brand-text)' }}
          >
            Ввод результата матча
          </h2>
          {(seasonName || leagueName) && (
            <p className="mt-0.5 text-sm" style={{ color: 'var(--color-brand-text-muted)' }}>
              {seasonName}{seasonName && leagueName ? ' • ' : ''}{leagueName}
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* ═══ ЛЕВАЯ КОЛОНКА: Дата и время ═══════════════════════════════ */}
          <div className="space-y-4">

            {/* Дата */}
            <div style={cardStyle}>
              <div className="label-caps text-[10px] mb-2" style={{ color: 'var(--color-brand-outline)' }}>
                📅 Дата матча
              </div>
              <div
                className="text-sm font-semibold mb-3"
                style={{ color: 'var(--color-brand-primary)' }}
              >
                {formatDate(selectedDate)}
              </div>
              <CustomCalendar value={selectedDate} onChange={setSelectedDate} />
            </div>

            {/* Время */}
            <div style={cardStyle}>
              <div className="label-caps text-[10px] mb-3" style={{ color: 'var(--color-brand-outline)' }}>
                ⏰ Время начала
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={hour}
                  onChange={e => setHour(+e.target.value)}
                  style={selectStyle()}
                  className="text-center font-semibold"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i} style={{ background: '#1c2028' }}>
                      {String(i).padStart(2, '0')}
                    </option>
                  ))}
                </select>

                <span
                  className="text-2xl font-black flex-shrink-0"
                  style={{ color: 'rgba(255,255,255,0.25)' }}
                >
                  :
                </span>

                <select
                  value={minute}
                  onChange={e => setMinute(+e.target.value)}
                  style={selectStyle()}
                  className="text-center font-semibold"
                >
                  {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                    <option key={m} value={m} style={{ background: '#1c2028' }}>
                      {String(m).padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ═══ ПРАВАЯ КОЛОНКА: Команды и счёт ════════════════════════════ */}
          <div className="space-y-4">

            {/* Выбор команд */}
            <div style={cardStyle}>
              <div className="label-caps text-[10px] mb-3" style={{ color: 'var(--color-brand-outline)' }}>
                ⚽ Команды
              </div>

              {/* Команда А */}
              <div className="mb-3">
                <label className="block text-xs mb-1.5" style={{ color: 'var(--color-brand-text-muted)' }}>
                  Команда 1 (хозяева)
                </label>
                <div className="relative">
                  {/* Цветовой кружок команды */}
                  {teamA && (
                    <div
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full pointer-events-none z-10"
                      style={{ backgroundColor: teamA.color }}
                    />
                  )}
                  <select
                    value={teamAId}
                    onChange={e => {
                      setTeamAId(e.target.value)
                      // Если выбрали ту же, что уже стоит в B — сбрасываем B
                      if (e.target.value === teamBId) setTeamBId('')
                    }}
                    style={{
                      ...selectStyle(teamA?.color),
                      paddingLeft: teamA ? '2rem' : '0.75rem',
                    }}
                  >
                    <option value="" style={{ background: '#1c2028' }}>— Выберите команду —</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id} style={{ background: '#1c2028' }}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Команда B */}
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--color-brand-text-muted)' }}>
                  Команда 2 (гости)
                </label>
                <div className="relative">
                  {teamB && (
                    <div
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full pointer-events-none z-10"
                      style={{ backgroundColor: teamB.color }}
                    />
                  )}
                  <select
                    value={teamBId}
                    onChange={e => setTeamBId(e.target.value)}
                    style={{
                      ...selectStyle(teamB?.color),
                      paddingLeft: teamB ? '2rem' : '0.75rem',
                    }}
                  >
                    <option value="" style={{ background: '#1c2028' }}>— Выберите команду —</option>
                    {teamsForB.map(t => (
                      <option key={t.id} value={t.id} style={{ background: '#1c2028' }}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Счёт матча */}
            <div style={cardStyle}>
              <div className="label-caps text-[10px] mb-4 text-center" style={{ color: 'var(--color-brand-outline)' }}>
                Счёт матча
              </div>

              <div className="flex items-start justify-center gap-2">
                {/* Счётчик А */}
                <ScoreCounter
                  value={scoreA}
                  onChange={setScoreA}
                  teamName={teamA?.name}
                  teamColor={teamA?.color}
                />

                {/* Разделитель */}
                <div
                  className="text-4xl font-black mt-10 flex-shrink-0 w-8 text-center"
                  style={{ color: 'rgba(255,255,255,0.18)' }}
                >
                  :
                </div>

                {/* Счётчик B */}
                <ScoreCounter
                  value={scoreB}
                  onChange={setScoreB}
                  teamName={teamB?.name}
                  teamColor={teamB?.color}
                />
              </div>

              {/* Превью результата */}
              {teamA && teamB && (
                <div
                  className="mt-4 text-center text-xs rounded-lg py-2 px-3"
                  style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--color-brand-outline)' }}
                >
                  {scoreA > scoreB
                    ? <><span style={{ color: 'var(--color-brand-primary)' }}>{teamA.name}</span> побеждает</>
                    : scoreB > scoreA
                      ? <><span style={{ color: 'var(--color-brand-primary)' }}>{teamB.name}</span> побеждает</>
                      : <span style={{ color: 'var(--color-brand-gold)' }}>Ничья</span>
                  }
                </div>
              )}
            </div>

            {/* Ошибка */}
            {error && (
              <div
                className="rounded-xl px-4 py-3 text-sm"
                style={{
                  background: 'rgba(239,68,68,0.10)',
                  color: '#f87171',
                  border: '1px solid rgba(239,68,68,0.20)',
                }}
              >
                ⚠️ {error}
              </div>
            )}

            {/* Кнопка сохранить */}
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
          </div>
        </div>
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
                <div
                  key={m.id}
                  className="flex items-center gap-2 py-2 px-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.025)' }}
                >
                  {/* Дата */}
                  <span
                    className="label-caps text-[9px] flex-shrink-0 w-14"
                    style={{ color: 'var(--color-brand-outline)' }}
                  >
                    {date}
                  </span>

                  {/* Команда A */}
                  <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                    <span
                      className="text-xs truncate"
                      style={{ color: winA ? 'var(--color-brand-primary)' : 'var(--color-brand-text-muted)', fontWeight: winA ? 700 : 400 }}
                    >
                      {tA.name}
                    </span>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: tA.color }} />
                  </div>

                  {/* Счёт */}
                  <div
                    className="text-sm font-black flex-shrink-0 px-2 tabular-nums"
                    style={{ color: 'var(--color-brand-text)' }}
                  >
                    {m.score_a} : {m.score_b}
                  </div>

                  {/* Команда B */}
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: tB.color }} />
                    <span
                      className="text-xs truncate"
                      style={{ color: winB ? 'var(--color-brand-primary)' : 'var(--color-brand-text-muted)', fontWeight: winB ? 700 : 400 }}
                    >
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
