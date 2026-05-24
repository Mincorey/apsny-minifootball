/**
 * AdminPanelPage — панель управления для администратора.
 *
 * Секции:
 *   1. Лиги    — создать / удалить лигу в текущем сезоне
 *   2. Команды — добавить / удалить команду в выбранной лиге
 *   3. Туры    — запланировать матч(и) нового тура (EPL-стиль)
 */

import { useState, useRef } from 'react'
import {
  Trophy, Users, ListOrdered, Plus, Trash2,
  ChevronDown, ChevronUp, Loader2, Check, Upload,
} from 'lucide-react'
import { uploadAndCompressImage } from '../lib/imageUtils'
import { useData } from '../context/DataContext'
import { useDialogs } from '../components/DialogsContext'
import { CustomSelect } from '../components/CustomSelect'
import { Spinner } from '../components/Spinner'
import { Empty } from '../components/ui/Empty'

// ─────────────────────────────────────────────────────────────────────────────
// Утилиты
// ─────────────────────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background:   'rgba(255,255,255,0.03)',
  border:       '1px solid rgba(255,255,255,0.07)',
  borderRadius: '1rem',
  padding:      '1.25rem',
}

const inputStyle: React.CSSProperties = {
  background:   'rgba(20,25,35,0.95)',
  border:       '1.5px solid rgba(255,255,255,0.10)',
  borderRadius: '0.75rem',
  color:        'var(--color-brand-text)',
  padding:      '0.6rem 0.75rem',
  fontSize:     '0.875rem',
  width:        '100%',
  outline:      'none',
}

const TEAM_COLORS = [
  '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71',
  '#1abc9c', '#3498db', '#9b59b6', '#e91e63',
  '#ff5722', '#607d8b', '#795548', '#009688',
]

// ─────────────────────────────────────────────────────────────────────────────
// Секция-аккордеон
// ─────────────────────────────────────────────────────────────────────────────

function Section({
  icon, title, children, defaultOpen = false,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div style={cardStyle}>
      <button
        type="button"
        className="w-full flex items-center gap-3 group"
        onClick={() => setOpen(o => !o)}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(0,117,49,0.18)', color: 'var(--color-brand-primary)' }}
        >
          {icon}
        </div>
        <span
          className="flex-1 text-left text-base font-bold"
          style={{ color: 'var(--color-brand-text)' }}
        >
          {title}
        </span>
        {open
          ? <ChevronUp size={16} style={{ color: 'var(--color-brand-outline)' }} />
          : <ChevronDown size={16} style={{ color: 'var(--color-brand-outline)' }} />}
      </button>

      {open && (
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {children}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Секция 1: Лиги
// ─────────────────────────────────────────────────────────────────────────────

function LeaguesSection() {
  const {
    season, leagues, loadingLeagues,
    createLeague, deleteLeague, refetchLeagues,
  } = useData()
  const { showToast, showConfirm } = useDialogs()

  const [name,    setName]    = useState('')
  const [saving,  setSaving]  = useState(false)
  const [success, setSuccess] = useState(false)

  const handleCreate = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    if (!season)  { showToast('Нет активного сезона', 'error'); return }

    setSaving(true)
    const { error } = await createLeague({
      seasonId:  season.id,
      name:      trimmed,
      sortOrder: leagues.length,
    })
    setSaving(false)

    if (error) {
      showToast(`Ошибка: ${error}`, 'error')
    } else {
      setSuccess(true)
      setName('')
      showToast(`Лига «${trimmed}» создана`, 'success', 3000)
      setTimeout(() => setSuccess(false), 2000)
    }
  }

  const handleDelete = (leagueId: string, leagueName: string) => {
    showConfirm({
      title:       'Удалить лигу',
      message:     `«${leagueName}» будет удалена вместе со всеми командами и матчами. Отменить нельзя.`,
      confirmText: 'Удалить',
      isDangerous: true,
      onConfirm: async () => {
        const { error } = await deleteLeague(leagueId)
        if (error) showToast(`Ошибка: ${error}`, 'error')
        else       showToast(`Лига «${leagueName}» удалена`, 'success', 3000)
      },
    })
  }

  return (
    <div className="space-y-4">

      {/* Список существующих лиг */}
      {loadingLeagues ? (
        <Spinner className="py-6" />
      ) : leagues.length === 0 ? (
        <p className="text-xs text-center py-3" style={{ color: 'var(--color-brand-outline)' }}>
          В текущем сезоне нет лиг
        </p>
      ) : (
        <div className="space-y-2">
          {leagues.map(l => (
            <div
              key={l.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.025)' }}
            >
              <Trophy size={14} style={{ color: 'var(--color-brand-primary)', flexShrink: 0 }} />
              <span className="flex-1 text-sm font-medium" style={{ color: 'var(--color-brand-text)' }}>
                {l.name}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(l.id, l.name)}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                style={{ background: 'rgba(239,68,68,0.10)', color: '#f87171' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.22)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.10)')}
                title="Удалить лигу"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Форма создания */}
      <div className="flex gap-2 mt-2">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          placeholder="Название новой лиги…"
          style={inputStyle}
          onFocus={e => (e.currentTarget.style.border = '1.5px solid rgba(122,219,138,0.35)')}
          onBlur={e  => (e.currentTarget.style.border = '1.5px solid rgba(255,255,255,0.10)')}
        />
        <button
          type="button"
          disabled={saving || !name.trim()}
          onClick={handleCreate}
          className="flex items-center gap-1.5 px-4 rounded-xl text-sm font-bold transition-all flex-shrink-0 disabled:opacity-40"
          style={success
            ? { background: 'rgba(122,219,138,0.15)', color: 'var(--color-brand-primary)', border: '1px solid rgba(122,219,138,0.25)' }
            : { background: 'var(--color-brand-accent)', color: '#fff' }
          }
        >
          {saving
            ? <Loader2 size={15} className="animate-spin" />
            : success
              ? <Check size={15} />
              : <Plus size={15} />}
          {success ? 'Создано' : 'Создать'}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Секция 2: Команды
// ─────────────────────────────────────────────────────────────────────────────

function TeamsSection() {
  const {
    leagues, selectedLeague, selectLeague,
    teams, loadingTeams,
    createTeam, deleteTeam,
  } = useData()
  const { showToast, showConfirm } = useDialogs()

  const [name,          setName]          = useState('')
  const [color,         setColor]         = useState(TEAM_COLORS[0])
  const [logoUrl,       setLogoUrl]       = useState('')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [saving,        setSaving]        = useState(false)
  const [success,       setSuccess]       = useState(false)

  const logoInputRef = useRef<HTMLInputElement>(null)

  const leagueOptions = leagues.map(l => ({ value: l.id, label: l.name }))

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    const fileName = `team-${crypto.randomUUID()}-${Date.now()}.jpg`
    const result = await uploadAndCompressImage('team-logos', file, 'teams', fileName)
    if (result) {
      setLogoUrl(result.url)
    } else {
      showToast('Ошибка при загрузке логотипа', 'error')
    }
    setUploadingLogo(false)
    e.currentTarget.value = ''
  }

  const handleCreate = async () => {
    const trimmed = name.trim()
    if (!trimmed)       return
    if (!selectedLeague) { showToast('Выберите лигу', 'error'); return }

    setSaving(true)
    const { error } = await createTeam({ leagueId: selectedLeague.id, name: trimmed, color, logoUrl: logoUrl || null })
    setSaving(false)

    if (error) {
      showToast(`Ошибка: ${error}`, 'error')
    } else {
      setSuccess(true)
      setName('')
      setLogoUrl('')
      showToast(`Команда «${trimmed}» добавлена`, 'success', 3000)
      setTimeout(() => setSuccess(false), 2000)
    }
  }

  const handleDelete = (teamId: string, teamName: string) => {
    showConfirm({
      title:       'Удалить команду',
      message:     `«${teamName}» будет удалена вместе со всеми её матчами. Это действие нельзя отменить.`,
      confirmText: 'Удалить',
      isDangerous: true,
      onConfirm: async () => {
        const { error } = await deleteTeam(teamId)
        if (error) showToast(`Ошибка: ${error}`, 'error')
        else       showToast(`Команда «${teamName}» удалена`, 'success', 3000)
      },
    })
  }

  return (
    <div className="space-y-4">

      {/* Переключатель лиги */}
      {leagues.length > 1 && (
        <div>
          <p className="text-xs mb-1.5" style={{ color: 'var(--color-brand-text-muted)' }}>Лига</p>
          <CustomSelect
            value={selectedLeague?.id ?? ''}
            onChange={v => {
              const l = leagues.find(x => x.id === v)
              if (l) selectLeague(l)
            }}
            options={leagueOptions}
          />
        </div>
      )}

      {/* Список команд */}
      {loadingTeams ? (
        <Spinner className="py-6" />
      ) : teams.length === 0 ? (
        <p className="text-xs text-center py-3" style={{ color: 'var(--color-brand-outline)' }}>
          В лиге нет команд
        </p>
      ) : (
        <div className="space-y-2">
          {teams.map(t => (
            <div
              key={t.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.025)' }}
            >
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
              <span className="flex-1 text-sm font-medium" style={{ color: 'var(--color-brand-text)' }}>
                {t.name}
              </span>
              <span className="label-caps text-[9px]" style={{ color: 'var(--color-brand-outline)' }}>
                {t.players?.length ?? 0} игр.
              </span>
              <button
                type="button"
                onClick={() => handleDelete(t.id, t.name)}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                style={{ background: 'rgba(239,68,68,0.10)', color: '#f87171' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.22)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.10)')}
                title="Удалить команду"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Форма создания */}
      {selectedLeague && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Название команды…"
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.border = '1.5px solid rgba(122,219,138,0.35)')}
              onBlur={e  => (e.currentTarget.style.border = '1.5px solid rgba(255,255,255,0.10)')}
            />
          </div>

          {/* Выбор цвета команды */}
          <div>
            <p className="text-xs mb-2" style={{ color: 'var(--color-brand-text-muted)' }}>Цвет команды</p>
            <div className="flex flex-wrap gap-2">
              {TEAM_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-lg transition-all"
                  style={{
                    backgroundColor: c,
                    outline: color === c ? `2px solid ${c}` : 'none',
                    outlineOffset: '2px',
                    transform: color === c ? 'scale(1.15)' : 'scale(1)',
                    boxShadow: color === c ? `0 0 10px ${c}66` : 'none',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Загрузка логотипа команды */}
          <div>
            <p className="text-xs mb-2" style={{ color: 'var(--color-brand-text-muted)' }}>Логотип команды (опционально)</p>
            <div className="flex items-center gap-3">
              {/* Превью логотипа */}
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.05)', border: `2px solid ${logoUrl ? color : 'rgba(255,255,255,0.10)'}` }}
              >
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo preview" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <Trophy size={18} style={{ color: 'var(--color-brand-outline)' }} />
                )}
              </div>
              {/* Кнопка загрузки */}
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                style={{ background: 'rgba(52,152,219,0.10)', color: '#60a5fa', border: '1px solid rgba(52,152,219,0.20)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(52,152,219,0.20)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(52,152,219,0.10)')}
              >
                {uploadingLogo
                  ? <Loader2 size={13} className="animate-spin" />
                  : <Upload size={13} />}
                {uploadingLogo ? 'Загрузка...' : logoUrl ? 'Изменить логотип' : 'Загрузить логотип'}
              </button>
              {/* Удалить логотип */}
              {logoUrl && (
                <button
                  type="button"
                  onClick={() => setLogoUrl('')}
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
                  style={{ background: 'rgba(239,68,68,0.10)', color: '#f87171' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.22)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.10)')}
                  title="Убрать логотип"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </div>

          <button
            type="button"
            disabled={saving || !name.trim()}
            onClick={handleCreate}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
            style={success
              ? { background: 'rgba(122,219,138,0.15)', color: 'var(--color-brand-primary)', border: '1px solid rgba(122,219,138,0.25)' }
              : { background: 'var(--color-brand-accent)', color: '#fff' }
            }
          >
            {saving
              ? <Loader2 size={15} className="animate-spin" />
              : success
                ? <Check size={15} />
                : <Plus size={15} />}
            {success ? 'Добавлено' : 'Добавить команду'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Секция 3: Туры — EPL-стиль
// ─────────────────────────────────────────────────────────────────────────────

interface FixtureRow {
  id:     string
  teamAId: string
  teamBId: string
}

function ToursSection() {
  const {
    selectedLeague, teams, matches,
    loadingTeams, loadingMatches,
    createMatch,
  } = useData()
  const { showToast } = useDialogs()

  // Следующий номер тура = max(tour) + 1 в текущей лиге
  const existingTours = Array.from(new Set(matches.map(m => m.tour))).sort((a, b) => b - a)
  const nextTour = (existingTours[0] ?? 0) + 1

  const [tourNum,  setTourNum]  = useState<number>(nextTour)
  const [date,     setDate]     = useState('')
  const [time,     setTime]     = useState('18:00')
  const [fixtures, setFixtures] = useState<FixtureRow[]>([{ id: crypto.randomUUID(), teamAId: '', teamBId: '' }])
  const [saving,   setSaving]   = useState(false)
  const [success,  setSuccess]  = useState(false)

  const teamOptions = teams.map(t => ({ value: t.id, label: t.name, color: t.color }))

  // Обновить строку фикстуры
  const updateFixture = (id: string, field: 'teamAId' | 'teamBId', value: string) => {
    setFixtures(rows => rows.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  const addFixture = () => setFixtures(rows => [...rows, { id: crypto.randomUUID(), teamAId: '', teamBId: '' }])

  const removeFixture = (id: string) =>
    setFixtures(rows => rows.length > 1 ? rows.filter(r => r.id !== id) : rows)

  const handleSave = async () => {
    const valid = fixtures.filter(f => f.teamAId && f.teamBId && f.teamAId !== f.teamBId)
    if (valid.length === 0) {
      showToast('Добавьте хотя бы один матч с разными командами', 'error')
      return
    }
    if (!selectedLeague) { showToast('Выберите лигу', 'error'); return }

    const scheduledAt = date
      ? new Date(`${date}T${time}:00`).toISOString()
      : null

    setSaving(true)
    let hasError = false

    for (const f of valid) {
      const { error } = await createMatch({
        leagueId:    selectedLeague.id,
        teamAId:     f.teamAId,
        teamBId:     f.teamBId,
        tour:        tourNum,
        scheduledAt,
      })
      if (error) { showToast(`Ошибка: ${error}`, 'error'); hasError = true; break }
    }

    setSaving(false)

    if (!hasError) {
      setSuccess(true)
      showToast(`Тур ${tourNum}: ${valid.length} матч(ей) добавлено`, 'success', 4000)
      // Сброс
      setTimeout(() => {
        setSuccess(false)
        setTourNum(n => n + 1)
        setFixtures([{ id: crypto.randomUUID(), teamAId: '', teamBId: '' }])
        setDate('')
      }, 2000)
    }
  }

  if (loadingTeams || loadingMatches) return <Spinner className="py-6" />
  if (!selectedLeague)                return <Empty text="Выберите лигу" />
  if (teams.length < 2)               return (
    <p className="text-xs text-center py-3" style={{ color: 'var(--color-brand-outline)' }}>
      Нужно минимум 2 команды в лиге
    </p>
  )

  return (
    <div className="space-y-4">

      {/* Информация о турах */}
      {existingTours.length > 0 && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
          style={{ background: 'rgba(0,117,49,0.08)', color: 'var(--color-brand-text-muted)' }}
        >
          <ListOrdered size={13} style={{ color: 'var(--color-brand-primary)', flexShrink: 0 }} />
          В лиге уже {existingTours.length} тур(а): туры с 1 по {existingTours[0]}
        </div>
      )}

      {/* Номер тура */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <p className="text-xs mb-1.5" style={{ color: 'var(--color-brand-text-muted)' }}>Номер тура</p>
          <input
            type="number"
            min={1}
            value={tourNum}
            onChange={e => setTourNum(Math.max(1, +e.target.value))}
            style={inputStyle}
            onFocus={e => (e.currentTarget.style.border = '1.5px solid rgba(122,219,138,0.35)')}
            onBlur={e  => (e.currentTarget.style.border = '1.5px solid rgba(255,255,255,0.10)')}
          />
        </div>
        <div className="flex-1">
          <p className="text-xs mb-1.5" style={{ color: 'var(--color-brand-text-muted)' }}>Дата (опционально)</p>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{ ...inputStyle, colorScheme: 'dark' }}
            onFocus={e => (e.currentTarget.style.border = '1.5px solid rgba(122,219,138,0.35)')}
            onBlur={e  => (e.currentTarget.style.border = '1.5px solid rgba(255,255,255,0.10)')}
          />
        </div>
        <div className="w-28">
          <p className="text-xs mb-1.5" style={{ color: 'var(--color-brand-text-muted)' }}>Время</p>
          <input
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
            style={{ ...inputStyle, colorScheme: 'dark' }}
            onFocus={e => (e.currentTarget.style.border = '1.5px solid rgba(122,219,138,0.35)')}
            onBlur={e  => (e.currentTarget.style.border = '1.5px solid rgba(255,255,255,0.10)')}
          />
        </div>
      </div>

      {/* Фикстуры */}
      <div>
        <p className="text-xs mb-2" style={{ color: 'var(--color-brand-text-muted)' }}>
          Матчи тура {tourNum}
        </p>
        <div className="space-y-2">
          {fixtures.map((f, idx) => {
            const usedInA = fixtures.filter(x => x.id !== f.id).map(x => x.teamAId)
            const usedInB = fixtures.filter(x => x.id !== f.id).map(x => x.teamBId)

            return (
              <div key={f.id} className="flex items-center gap-2">

                {/* Номер */}
                <span
                  className="label-caps text-[9px] w-5 text-center flex-shrink-0"
                  style={{ color: 'var(--color-brand-outline)' }}
                >
                  {idx + 1}
                </span>

                {/* Команда A */}
                <div className="flex-1 min-w-0">
                  <CustomSelect
                    value={f.teamAId}
                    onChange={v => {
                      const val = String(v)
                      updateFixture(f.id, 'teamAId', val)
                      if (val === f.teamBId) updateFixture(f.id, 'teamBId', '')
                    }}
                    options={teamOptions}
                    placeholder="Хозяева"
                    accentColor={teams.find(t => t.id === f.teamAId)?.color}
                  />
                </div>

                {/* Разделитель */}
                <span
                  className="text-sm font-black flex-shrink-0"
                  style={{ color: 'rgba(255,255,255,0.20)' }}
                >vs</span>

                {/* Команда B */}
                <div className="flex-1 min-w-0">
                  <CustomSelect
                    value={f.teamBId}
                    onChange={v => updateFixture(f.id, 'teamBId', String(v))}
                    options={teamOptions.filter(o => o.value !== f.teamAId)}
                    placeholder="Гости"
                    accentColor={teams.find(t => t.id === f.teamBId)?.color}
                    align="right"
                  />
                </div>

                {/* Кнопка удаления строки */}
                <button
                  type="button"
                  onClick={() => removeFixture(f.id)}
                  disabled={fixtures.length === 1}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 disabled:opacity-20"
                  style={{ background: 'rgba(239,68,68,0.10)', color: '#f87171' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.22)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.10)')}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )
          })}
        </div>

        {/* Добавить ещё матч */}
        <button
          type="button"
          onClick={addFixture}
          className="mt-2 flex items-center gap-1.5 text-xs py-2 px-3 rounded-lg transition-colors"
          style={{ color: 'var(--color-brand-text-muted)', background: 'rgba(255,255,255,0.04)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.09)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
        >
          <Plus size={13} /> Добавить матч
        </button>
      </div>

      {/* Кнопка сохранить тур */}
      <button
        type="button"
        disabled={saving || success}
        onClick={handleSave}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-70"
        style={success ? {
          background: 'rgba(122,219,138,0.15)',
          color:      'var(--color-brand-primary)',
          border:     '1px solid rgba(122,219,138,0.25)',
        } : {
          background: 'var(--color-brand-accent)',
          color:      '#fff',
          boxShadow:  '0 0 20px rgba(0,117,49,0.30)',
        }}
      >
        {saving
          ? <><Loader2 size={16} className="animate-spin" /> Сохранение...</>
          : success
            ? <><Check size={16} /> Тур {tourNum} сохранён!</>
            : <><ListOrdered size={16} /> Сохранить тур {tourNum} ({fixtures.filter(f => f.teamAId && f.teamBId && f.teamAId !== f.teamBId).length} матч(ей))</>
        }
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Главный компонент
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  seasonName?: string
}

export function AdminPanelPage({ seasonName }: Props) {
  const { season } = useData()

  return (
    <div className="space-y-4">

      {/* Заголовок */}
      <div className="flex items-start gap-3 mb-2">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: 'rgba(0,117,49,0.20)', color: 'var(--color-brand-primary)' }}
        >
          <Trophy size={20} />
        </div>
        <div>
          <h2
            className="text-2xl sm:text-3xl font-extrabold"
            style={{ color: 'var(--color-brand-text)' }}
          >
            Панель администратора
          </h2>
          {seasonName && (
            <p className="mt-0.5 text-sm" style={{ color: 'var(--color-brand-text-muted)' }}>
              {seasonName}
            </p>
          )}
        </div>
      </div>

      {/* Секции-аккордеоны */}
      <Section icon={<Trophy size={16} />} title="Лиги" defaultOpen={true}>
        <LeaguesSection />
      </Section>

      <Section icon={<Users size={16} />} title="Команды">
        <TeamsSection />
      </Section>

      <Section icon={<ListOrdered size={16} />} title="Туры и расписание">
        <ToursSection />
      </Section>
    </div>
  )
}
