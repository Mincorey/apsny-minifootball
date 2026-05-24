/**
 * SchedulePage — расписание матчей лиги.
 *
 * Публичный вид: матчи сгруппированы по турам, дата/время/стадион.
 * Режим админа: создание, редактирование (инлайн) и удаление запланированных матчей.
 */

import { useMemo, useState } from 'react'
import {
  ClipboardList, Plus, Edit2, Trash2, Check, Loader2,
  X, ChevronDown, ChevronUp, MapPin, Calendar, Clock,
} from 'lucide-react'
import { useData } from '../context/DataContext'
import { useDialogs } from '../components/DialogsContext'
import { Spinner } from '../components/Spinner'
import { Empty } from '../components/ui/Empty'
import { TeamLabel } from '../components/ui/TeamLabel'
import type { Match } from '../types/database'

type MatchV = Match & { venue?: string | null }

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return ''
  return new Date(iso).toISOString().slice(0, 10)
}

function toTimeInputValue(iso: string | null | undefined): string {
  if (!iso) return '12:00'
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function buildIso(date: string, time: string): string | null {
  if (!date) return null
  const [y, mo, d] = date.split('-').map(Number)
  const [h, mi] = time.split(':').map(Number)
  return new Date(y, mo - 1, d, h || 0, mi || 0, 0).toISOString()
}

function fmtDateShort(iso: string | null | undefined): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

function fmtTimeShort(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const INP = 'w-full rounded-xl px-3 py-2 text-sm bg-white/[0.04] border border-white/10 focus:outline-none text-white placeholder:text-white/30'
const INP_DARK = INP + ' [color-scheme:dark]'

interface CreateFormProps {
  leagueId: string
  teams: ReturnType<typeof useData>['teams']
  nextTour: number
  onCreated: () => void
}

function CreateForm({ leagueId, teams, nextTour, onCreated }: CreateFormProps) {
  const { createMatch } = useData()
  const { showToast } = useDialogs()
  const [tour, setTour]   = useState(nextTour)
  const [teamA, setTeamA] = useState('')
  const [teamB, setTeamB] = useState('')
  const [date, setDate]   = useState('')
  const [time, setTime]   = useState('12:00')
  const [venue, setVenue] = useState('')
  const [saving, setSaving] = useState(false)

  const teamsForB = teams.filter(t => t.id !== teamA)

  const handleSave = async () => {
    if (!teamA || !teamB) { showToast('Выберите обе команды', 'error'); return }
    if (teamA === teamB)  { showToast('Команды не могут совпадать', 'error'); return }
    setSaving(true)
    const { error } = await createMatch({
      leagueId, teamAId: teamA, teamBId: teamB, tour,
      scheduledAt: buildIso(date, time),
      venue: venue.trim() || null,
    })
    setSaving(false)
    if (error) { showToast(`Ошибка: ${error}`, 'error'); return }
    showToast(`Матч добавлен (Тур ${tour})`, 'success', 3000)
    setTeamA(''); setTeamB(''); setDate(''); setTime('12:00'); setVenue('')
    setTour(t => t + 1)
    onCreated()
  }

  const lbl = 'block text-xs mb-1.5 font-medium'
  const lc  = { color: 'var(--color-brand-text-muted)' }

  return (
    <div className="space-y-3 pt-1">
      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold flex-shrink-0" style={{ ...lc, width: '3.5rem' }}>Тур</label>
        <input type="number" min={1} max={99} value={tour}
          onChange={e => setTour(parseInt(e.target.value) || 1)}
          className={INP} style={{ width: '5rem', flex: 'none' }} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className={lbl} style={lc}>Команда 1 (хозяева)</label>
          <select value={teamA} onChange={e => { setTeamA(e.target.value); if (e.target.value === teamB) setTeamB('') }}
            className={INP} style={{ cursor: 'pointer' }}>
            <option value="">— Выберите —</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl} style={lc}>Команда 2 (гости)</label>
          <select value={teamB} onChange={e => setTeamB(e.target.value)}
            className={INP} style={{ cursor: 'pointer' }}>
            <option value="">— Выберите —</option>
            {teamsForB.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={lbl} style={lc}><Calendar size={10} className="inline mr-1" />Дата</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={INP_DARK} />
        </div>
        <div>
          <label className={lbl} style={lc}><Clock size={10} className="inline mr-1" />Время</label>
          <input type="time" value={time} onChange={e => setTime(e.target.value)} className={INP_DARK} />
        </div>
      </div>

      <div>
        <label className={lbl} style={lc}><MapPin size={10} className="inline mr-1" />Место проведения</label>
        <input type="text" value={venue} onChange={e => setVenue(e.target.value)}
          placeholder="Название стадиона (необязательно)" className={INP} />
      </div>

      <button type="button" disabled={saving || !teamA || !teamB} onClick={handleSave}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40 active:scale-[0.98]"
        style={{ background: 'var(--color-brand-accent)', color: '#fff', boxShadow: '0 0 16px rgba(0,117,49,0.28)' }}>
        {saving ? <><Loader2 size={15} className="animate-spin" /> Сохранение...</> : <><Check size={15} /> Добавить в расписание</>}
      </button>
    </div>
  )
}

interface EditCardProps {
  match: MatchV
  teams: ReturnType<typeof useData>['teams']
  onSaved: () => void
  onCancel: () => void
}

function EditCard({ match, teams, onSaved, onCancel }: EditCardProps) {
  const { updateMatch } = useData()
  const { showToast } = useDialogs()
  const [tour,  setTour]  = useState(match.tour)
  const [teamA, setTeamA] = useState(match.team_a_id)
  const [teamB, setTeamB] = useState(match.team_b_id)
  const [date,  setDate]  = useState(toDateInputValue(match.scheduled_at))
  const [time,  setTime]  = useState(toTimeInputValue(match.scheduled_at))
  const [venue, setVenue] = useState(match.venue ?? '')
  const [saving, setSaving] = useState(false)

  const teamsForB = teams.filter(t => t.id !== teamA)
  const lbl = 'block text-xs mb-1 font-medium'
  const lc  = { color: 'var(--color-brand-text-muted)' }

  const handleSave = async () => {
    if (!teamA || !teamB) { showToast('Выберите обе команды', 'error'); return }
    if (teamA === teamB)  { showToast('Команды не могут совпадать', 'error'); return }
    setSaving(true)
    const { error } = await updateMatch({
      matchId: match.id, tour, teamAId: teamA, teamBId: teamB,
      scheduledAt: buildIso(date, time), venue: venue.trim() || null,
    })
    setSaving(false)
    if (error) showToast(`Ошибка: ${error}`, 'error')
    else { showToast('Матч обновлён', 'success', 2000); onSaved() }
  }

  return (
    <div className="rounded-2xl p-4 space-y-3"
      style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(96,165,250,0.20)' }}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold" style={{ color: '#60a5fa' }}>✏️ Редактирование матча</span>
        <button type="button" onClick={onCancel}
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--color-brand-text-muted)' }}>
          <X size={13} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold flex-shrink-0" style={{ ...lc, width: '3.5rem' }}>Тур</label>
        <input type="number" min={1} max={99} value={tour}
          onChange={e => setTour(parseInt(e.target.value) || 1)}
          className={INP} style={{ width: '5rem', flex: 'none' }} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className={lbl} style={lc}>Команда 1</label>
          <select value={teamA} onChange={e => { setTeamA(e.target.value); if (e.target.value === teamB) setTeamB('') }}
            className={INP} style={{ cursor: 'pointer' }}>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl} style={lc}>Команда 2</label>
          <select value={teamB} onChange={e => setTeamB(e.target.value)}
            className={INP} style={{ cursor: 'pointer' }}>
            <option value="">— Выберите —</option>
            {teamsForB.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={lbl} style={lc}>Дата</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={INP_DARK} />
        </div>
        <div>
          <label className={lbl} style={lc}>Время</label>
          <input type="time" value={time} onChange={e => setTime(e.target.value)} className={INP_DARK} />
        </div>
      </div>

      <div>
        <label className={lbl} style={lc}>Место проведения</label>
        <input type="text" value={venue} onChange={e => setVenue(e.target.value)}
          placeholder="Название стадиона" className={INP} />
      </div>

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2 rounded-xl text-sm font-semibold transition-colors"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--color-brand-text-muted)' }}>
          Отменить
        </button>
        <button type="button" disabled={saving} onClick={handleSave}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
          style={{ background: 'var(--color-brand-accent)', color: '#fff' }}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          Сохранить
        </button>
      </div>
    </div>
  )
}

interface Props {
  isAdmin: boolean
  onEnterResult: (m: Match) => void
}

export function SchedulePage({ isAdmin, onEnterResult }: Props) {
  const {
    matches: allMatches, teams, selectedLeague,
    loadingMatches, loadingTeams,
    errorMatches, errorTeams,
    deleteMatch, refetchMatches,
  } = useData()
  const { showToast, showConfirm } = useDialogs()

  const [showCreate, setShowCreate] = useState(false)
  const [editId,     setEditId]     = useState<string | null>(null)
  const [showPlayed, setShowPlayed] = useState(false)

  const loading = loadingMatches || loadingTeams
  const error   = errorMatches || errorTeams

  if (!selectedLeague) return <Empty text="Выберите лигу" />
  if (loading) return <Spinner className="py-20" />
  if (error)   return <Empty text={`Ошибка: ${error}`} />

  const scheduledMatches = (allMatches as MatchV[])
    .filter(m => m.status === 'scheduled')
    .sort((a, b) => a.tour !== b.tour ? a.tour - b.tour : (a.scheduled_at ?? '').localeCompare(b.scheduled_at ?? ''))

  const playedMatches = (allMatches as MatchV[])
    .filter(m => m.status === 'played')
    .sort((a, b) => (b.played_at ?? b.created_at).localeCompare(a.played_at ?? a.created_at))

  const tourGroups = useMemo(() => {
    const map = new Map<number, MatchV[]>()
    for (const m of scheduledMatches) {
      const arr = map.get(m.tour) ?? []; arr.push(m); map.set(m.tour, arr)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a - b)
  }, [scheduledMatches])

  const teamMap  = useMemo(() => new Map(teams.map(t => [t.id, t])), [teams])
  const nextTour = scheduledMatches.length > 0 ? Math.max(...scheduledMatches.map(m => m.tour)) + 1 : 1

  const handleDelete = (m: MatchV) => {
    const tA = teamMap.get(m.team_a_id), tB = teamMap.get(m.team_b_id)
    const label = tA && tB ? `${tA.name} vs ${tB.name}` : 'матч'
    showConfirm({
      title: 'Удалить матч', confirmText: 'Удалить', isDangerous: true,
      message: `«${label}» (Тур ${m.tour}) будет удалён из расписания.`,
      onConfirm: async () => {
        const { error: err } = await deleteMatch(m.id)
        if (err) showToast(`Ошибка: ${err}`, 'error')
        else     showToast('Матч удалён', 'success', 2500)
      },
    })
  }

  return (
    <div className="space-y-4">

      {/* ── Создать матч (admin) ──────────────────────────────────────────── */}
      {isAdmin && (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <button type="button" onClick={() => setShowCreate(v => !v)}
            className="w-full flex items-center gap-3 px-4 py-3.5 transition-colors"
            style={{ color: 'var(--color-brand-text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(0,117,49,0.22)', color: 'var(--color-brand-primary)' }}>
              <Plus size={15} />
            </div>
            <span className="flex-1 text-sm font-semibold text-left" style={{ color: 'var(--color-brand-text)' }}>
              Добавить матч в расписание
            </span>
            <span className="text-xs hidden sm:inline" style={{ color: 'var(--color-brand-outline)' }}>
              {selectedLeague.name}
            </span>
            {showCreate ? <ChevronUp size={15} className="flex-shrink-0" /> : <ChevronDown size={15} className="flex-shrink-0" />}
          </button>
          {showCreate && (
            <div className="px-4 pb-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="pt-3">
                <CreateForm leagueId={selectedLeague.id} teams={teams} nextTour={nextTour}
                  onCreated={() => { refetchMatches(); setShowCreate(false) }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Матчи по турам ───────────────────────────────────────────────── */}
      {tourGroups.length === 0 ? (
        <Empty text={isAdmin ? 'Расписание пусто — добавьте первый матч выше' : 'Запланированных матчей нет'} />
      ) : (
        <div className="space-y-5">
          {tourGroups.map(([tour, tourMatches]) => (
            <div key={tour}>
              {/* Тур-заголовок */}
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="label-caps text-[10px] px-2.5 py-1 rounded-full font-bold"
                  style={{ background: 'rgba(0,117,49,0.18)', color: 'var(--color-brand-primary)' }}>
                  ТУР {tour}
                </span>
                <span className="text-[10px] font-medium" style={{ color: 'var(--color-brand-outline)' }}>
                  {tourMatches.length} {tourMatches.length === 1 ? 'матч' : tourMatches.length < 5 ? 'матча' : 'матчей'}
                </span>
              </div>

              <div className="space-y-2">
                {tourMatches.map(m => {
                  const tA = teamMap.get(m.team_a_id)
                  const tB = teamMap.get(m.team_b_id)
                  if (!tA || !tB) return null

                  if (editId === m.id) {
                    return (
                      <EditCard key={m.id} match={m} teams={teams}
                        onSaved={() => { setEditId(null); refetchMatches() }}
                        onCancel={() => setEditId(null)} />
                    )
                  }

                  const dateStr = fmtDateShort(m.scheduled_at)
                  const timeStr = fmtTimeShort(m.scheduled_at)

                  return (
                    <div key={m.id} className="bento-card px-4 py-3.5">
                      {/* Верхняя строка: мета + кнопки */}
                      <div className="flex items-start justify-between mb-3 gap-2">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
                          {m.scheduled_at ? (
                            <>
                              <span className="flex items-center gap-1 text-[11px] font-semibold"
                                style={{ color: 'var(--color-brand-text-muted)' }}>
                                <Calendar size={10} style={{ color: 'var(--color-brand-primary)' }} />
                                {dateStr}
                              </span>
                              {timeStr && (
                                <span className="flex items-center gap-1 text-[11px]"
                                  style={{ color: 'var(--color-brand-outline)' }}>
                                  <Clock size={10} />{timeStr}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-[11px] italic" style={{ color: 'var(--color-brand-outline)' }}>
                              Дата не указана
                            </span>
                          )}
                          {m.venue && (
                            <span className="flex items-center gap-1 text-[11px] truncate max-w-[160px]"
                              style={{ color: 'var(--color-brand-outline)' }}>
                              <MapPin size={10} className="flex-shrink-0" />{m.venue}
                            </span>
                          )}
                        </div>

                        {/* Кнопки admin */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {isAdmin && (
                            <>
                              <button type="button" onClick={() => onEnterResult(m)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold label-caps transition-all"
                                style={{ background: 'rgba(0,117,49,0.15)', color: 'var(--color-brand-primary)', border: '1px solid rgba(122,219,138,0.18)' }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,117,49,0.28)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,117,49,0.15)')}
                                title="Ввести результат">
                                <ClipboardList size={11} /> Рез.
                              </button>
                              <button type="button" onClick={() => setEditId(m.id)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                                style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-brand-text-muted)' }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                                title="Редактировать">
                                <Edit2 size={12} />
                              </button>
                              <button type="button" onClick={() => handleDelete(m)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                                style={{ background: 'rgba(239,68,68,0.10)', color: '#f87171' }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.22)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.10)')}
                                title="Удалить">
                                <Trash2 size={12} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Команды VS */}
                      <div className="flex items-center gap-2">
                        <TeamLabel team={tA} align="left" />
                        <div className="flex-shrink-0 px-3 py-1 rounded-xl mx-1 text-center"
                          style={{ background: 'rgba(255,255,255,0.04)' }}>
                          <span className="text-sm font-black" style={{ color: 'var(--color-brand-text-muted)' }}>VS</span>
                        </div>
                        <TeamLabel team={tB} align="right" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Сыгранные (свёрнуто) ─────────────────────────────────────────── */}
      {playedMatches.length > 0 && (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <button type="button" onClick={() => setShowPlayed(v => !v)}
            className="w-full flex items-center gap-2 px-4 py-3 transition-colors"
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <span className="flex-1 text-xs font-semibold text-left" style={{ color: 'var(--color-brand-outline)' }}>
              📋 Сыгранные матчи ({playedMatches.length})
            </span>
            {showPlayed ? <ChevronUp size={13} style={{ color: 'var(--color-brand-outline)' }} /> : <ChevronDown size={13} style={{ color: 'var(--color-brand-outline)' }} />}
          </button>
          {showPlayed && (
            <div className="px-3 pb-3 space-y-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              {playedMatches.map(m => {
                const tA = teamMap.get(m.team_a_id), tB = teamMap.get(m.team_b_id)
                if (!tA || !tB) return null
                const winA = (m.score_a ?? 0) > (m.score_b ?? 0)
                const winB = (m.score_b ?? 0) > (m.score_a ?? 0)
                const ds = m.played_at ? new Date(m.played_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : '—'
                return (
                  <div key={m.id} className="flex items-center gap-2 py-2 px-2 rounded-xl mt-1.5"
                    style={{ background: 'rgba(255,255,255,0.02)', opacity: 0.75 }}>
                    <span className="label-caps text-[9px] flex-shrink-0 w-12" style={{ color: 'var(--color-brand-outline)' }}>{ds}</span>
                    <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                      <span className="text-xs truncate" style={{ color: winA ? 'var(--color-brand-primary)' : 'var(--color-brand-text-muted)', fontWeight: winA ? 700 : 400 }}>{tA.name}</span>
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: tA.color }} />
                    </div>
                    <div className="text-sm font-black flex-shrink-0 px-2 tabular-nums" style={{ color: 'var(--color-brand-text)' }}>{m.score_a} : {m.score_b}</div>
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: tB.color }} />
                      <span className="text-xs truncate" style={{ color: winB ? 'var(--color-brand-primary)' : 'var(--color-brand-text-muted)', fontWeight: winB ? 700 : 400 }}>{tB.name}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
