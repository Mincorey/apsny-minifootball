import { useState, useRef, useCallback } from 'react'
import { Check, ChevronRight, X, Plus, Trash2, Upload, Loader2, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useData } from '../context/DataContext'
import { useToast } from './Toast'
import { uploadAndCompressImage } from '../lib/imageUtils'
import { generateUUID } from '../lib/uuid'
import { COLOR_PALETTE } from '../constants/colors'

// ── Типы ─────────────────────────────────────────────────────────────────────

interface WizardLeague {
  id: string
  name: string
}

interface WizardTeam {
  id: string
  name: string
  color: string
  logoUrl: string | null
}

type Step = 1 | 2 | 3

interface Props {
  onClose: () => void
}

// ── Компонент прогресса ───────────────────────────────────────────────────────

function ProgressBar({ step }: { step: Step }) {
  const steps = [
    { num: 1, label: 'Сезон' },
    { num: 2, label: 'Лиги' },
    { num: 3, label: 'Команды' },
  ]
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((s, i) => (
        <div key={s.num} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${
                step > s.num
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : step === s.num
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                  : 'bg-gray-800 border-gray-600 text-gray-400'
              }`}
            >
              {step > s.num ? <Check className="w-4 h-4" /> : s.num}
            </div>
            <span className={`text-xs mt-1 font-medium ${step >= s.num ? 'text-emerald-400' : 'text-gray-500'}`}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-16 h-0.5 mb-5 mx-1 transition-all ${step > s.num + 0 ? 'bg-emerald-500' : 'bg-gray-700'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Главный компонент ─────────────────────────────────────────────────────────

export function SeasonWizard({ onClose }: Props) {
  const { createSeason, createLeague, createTeam, deleteSeason, refetchSeasons, refetchLeagues } = useData()
  const { show: showToast } = useToast()

  const [step, setStep] = useState<Step>(1)
  const [saving, setSaving] = useState(false)
  const [cancelConfirm, setCancelConfirm] = useState(false)

  // Step 1 state
  const [seasonName, setSeasonName] = useState('')
  const [seasonYear, setSeasonYear] = useState(new Date().getFullYear())
  const [step1Error, setStep1Error] = useState('')
  const [createdSeasonId, setCreatedSeasonId] = useState<string | null>(null)
  const [createdSeasonName, setCreatedSeasonName] = useState('')

  // Step 2 state
  const [leagueName, setLeagueName] = useState('')
  const [step2Error, setStep2Error] = useState('')
  const [createdLeagues, setCreatedLeagues] = useState<WizardLeague[]>([])
  const [addingLeague, setAddingLeague] = useState(false)
  const [activeLeagueTab, setActiveLeagueTab] = useState<string | null>(null)

  // Step 3 state — teamsPerLeague: Map leagueId -> WizardTeam[]
  const [teamsPerLeague, setTeamsPerLeague] = useState<Map<string, WizardTeam[]>>(new Map())
  const [teamFormLeague, setTeamFormLeague] = useState<string | null>(null)
  const [newTeamName, setNewTeamName] = useState('')
  const [newTeamColor, setNewTeamColor] = useState(COLOR_PALETTE[0].hex)
  const [newTeamLogoUrl, setNewTeamLogoUrl] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [addingTeam, setAddingTeam] = useState(false)
  const [step3Error, setStep3Error] = useState('')

  // Pool of all existing teams
  const [allTeams, setAllTeams] = useState<WizardTeam[]>([])
  const [showPool, setShowPool] = useState(false)
  const [loadingPool, setLoadingPool] = useState(false)

  const logoInputRef = useRef<HTMLInputElement>(null)

  // ── Загрузка пула команд ────────────────────────────────────────────────────

  const loadTeamPool = useCallback(async () => {
    setLoadingPool(true)
    const { data } = await supabase
      .from('teams')
      .select('id, name, color, logo_url, created_at')
      .order('name', { ascending: true })
    setAllTeams((data ?? []).map((t: { id: string; name: string; color: string; logo_url: string | null }) => ({
      id: t.id, name: t.name, color: t.color, logoUrl: t.logo_url,
    })))
    setLoadingPool(false)
  }, [])

  // ── Шаг 1: создать сезон ────────────────────────────────────────────────────

  const handleStep1 = async () => {
    if (!seasonName.trim()) { setStep1Error('Введите название сезона'); return }
    setSaving(true)
    const { error, id } = await createSeason({ name: seasonName.trim(), year: seasonYear })
    setSaving(false)
    if (error) { setStep1Error(error); return }
    setCreatedSeasonId(id!)
    setCreatedSeasonName(seasonName.trim())
    setStep1Error('')
    setStep(2)
  }

  // ── Шаг 2: добавить лигу ───────────────────────────────────────────────────

  const handleAddLeague = async () => {
    if (!leagueName.trim()) { setStep2Error('Введите название лиги'); return }
    if (!createdSeasonId) return
    setAddingLeague(true)
    const { error, id } = await createLeague({ seasonId: createdSeasonId, name: leagueName.trim(), sortOrder: createdLeagues.length })
    setAddingLeague(false)
    if (error) { setStep2Error(error); return }
    const newLeague: WizardLeague = { id: id!, name: leagueName.trim() }
    setCreatedLeagues(prev => [...prev, newLeague])
    setTeamsPerLeague(prev => { const m = new Map(prev); m.set(id!, []); return m })
    if (!activeLeagueTab) setActiveLeagueTab(id!)
    setLeagueName('')
    setStep2Error('')
  }

  const handleDeleteLeague = async (leagueId: string) => {
    await supabase.from('leagues').delete().eq('id', leagueId)
    setCreatedLeagues(prev => prev.filter(l => l.id !== leagueId))
    setTeamsPerLeague(prev => { const m = new Map(prev); m.delete(leagueId); return m })
    if (activeLeagueTab === leagueId) {
      const remaining = createdLeagues.filter(l => l.id !== leagueId)
      setActiveLeagueTab(remaining.length > 0 ? remaining[0].id : null)
    }
  }

  const handleStep2Next = () => {
    if (createdLeagues.length === 0) { setStep2Error('Добавьте хотя бы одну лигу'); return }
    setStep2Error('')
    if (createdLeagues.length > 0) setActiveLeagueTab(createdLeagues[0].id)
    loadTeamPool()
    setStep(3)
  }

  // ── Шаг 3: добавить команды ────────────────────────────────────────────────

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    const fileName = `logo_${Date.now()}.jpg`
    const result = await uploadAndCompressImage('team-logos', file, 'logos', fileName)
    setUploadingLogo(false)
    if (result) setNewTeamLogoUrl(result.url)
  }

  const handleAddTeam = async (leagueId: string) => {
    if (!newTeamName.trim()) { setStep3Error('Введите название команды'); return }
    setAddingTeam(true)
    const { error, id } = await createTeam({ leagueId, name: newTeamName.trim(), color: newTeamColor, logoUrl: newTeamLogoUrl })
    setAddingTeam(false)
    if (error) { setStep3Error(error); return }
    const newTeam: WizardTeam = { id: id!, name: newTeamName.trim(), color: newTeamColor, logoUrl: newTeamLogoUrl }
    setTeamsPerLeague(prev => {
      const m = new Map(prev)
      m.set(leagueId, [...(m.get(leagueId) ?? []), newTeam])
      return m
    })
    setNewTeamName('')
    setNewTeamColor(COLOR_PALETTE[0].hex)
    setNewTeamLogoUrl(null)
    setTeamFormLeague(null)
    setStep3Error('')
  }

  const handleAddFromPool = async (leagueId: string, poolTeam: WizardTeam) => {
    // Проверяем что команда с таким именем ещё не добавлена в эту лигу
    const existing = teamsPerLeague.get(leagueId) ?? []
    if (existing.some(t => t.name === poolTeam.name)) return
    setAddingTeam(true)
    const { error, id } = await createTeam({ leagueId, name: poolTeam.name, color: poolTeam.color, logoUrl: poolTeam.logoUrl })
    setAddingTeam(false)
    if (error) return
    const newTeam: WizardTeam = { id: id!, name: poolTeam.name, color: poolTeam.color, logoUrl: poolTeam.logoUrl }
    setTeamsPerLeague(prev => {
      const m = new Map(prev)
      m.set(leagueId, [...(m.get(leagueId) ?? []), newTeam])
      return m
    })
  }

  const handleRemoveTeam = async (leagueId: string, teamId: string) => {
    await supabase.from('teams').delete().eq('id', teamId)
    setTeamsPerLeague(prev => {
      const m = new Map(prev)
      m.set(leagueId, (m.get(leagueId) ?? []).filter(t => t.id !== teamId))
      return m
    })
  }

  // ── Финиш ──────────────────────────────────────────────────────────────────

  const handleFinish = () => {
    refetchSeasons()
    refetchLeagues()
    showToast('Сезон создан!', 'success')
    onClose()
  }

  // ── Отмена ─────────────────────────────────────────────────────────────────

  const handleCancel = async () => {
    if (step === 1 && !seasonName.trim()) { onClose(); return }
    setCancelConfirm(true)
  }

  const handleConfirmCancel = async () => {
    if (createdSeasonId) {
      await deleteSeason(createdSeasonId)
    }
    onClose()
  }

  // ── Рендер ─────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2 flex-shrink-0">
          <h2 className="text-xl font-bold text-white">Новый сезон</h2>
          <button onClick={handleCancel} className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 pt-4 flex-shrink-0">
          <ProgressBar step={step} />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">

          {/* ─ Шаг 1 ─ */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Название сезона</h3>
                <p className="text-gray-400 text-sm mb-4">Введите название и год проведения чемпионата</p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Название *</label>
                <input
                  type="text"
                  value={seasonName}
                  onChange={e => setSeasonName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleStep1()}
                  placeholder="Пример: Чемпионат 2026"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Год</label>
                <input
                  type="number"
                  value={seasonYear}
                  onChange={e => setSeasonYear(parseInt(e.target.value) || new Date().getFullYear())}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              {step1Error && <p className="text-red-400 text-sm">{step1Error}</p>}
              <button
                onClick={handleStep1}
                disabled={saving}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Далее</span><ChevronRight className="w-5 h-5" /></>}
              </button>
            </div>
          )}

          {/* ─ Шаг 2 ─ */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Лиги в сезоне «{createdSeasonName}»</h3>
                <p className="text-gray-400 text-sm mb-4">Добавьте одну или несколько лиг</p>
              </div>

              {/* Список созданных лиг */}
              {createdLeagues.length > 0 && (
                <div className="space-y-2">
                  {createdLeagues.map(lg => (
                    <div key={lg.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3 border border-gray-700">
                      <span className="text-white font-medium">{lg.name}</span>
                      <button
                        onClick={() => handleDeleteLeague(lg.id)}
                        className="text-gray-500 hover:text-red-400 transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Форма добавления лиги */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={leagueName}
                  onChange={e => setLeagueName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddLeague()}
                  placeholder="Название лиги"
                  className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <button
                  onClick={handleAddLeague}
                  disabled={addingLeague}
                  className="bg-emerald-700 hover:bg-emerald-600 disabled:bg-gray-700 text-white px-4 py-3 rounded-lg flex items-center gap-1 transition-colors font-medium"
                >
                  {addingLeague ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /><span>Добавить</span></>}
                </button>
              </div>

              {step2Error && <p className="text-red-400 text-sm">{step2Error}</p>}

              <button
                onClick={handleStep2Next}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <span>Далее</span><ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* ─ Шаг 3 ─ */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Команды по лигам</h3>
                <p className="text-gray-400 text-sm">Добавьте команды в каждую лигу</p>
              </div>

              {/* Табы лиг */}
              <div className="flex gap-2 flex-wrap">
                {createdLeagues.map(lg => (
                  <button
                    key={lg.id}
                    onClick={() => { setActiveLeagueTab(lg.id); setTeamFormLeague(null); setShowPool(false) }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeLeagueTab === lg.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {lg.name}
                    <span className="ml-2 text-xs opacity-70">
                      {teamsPerLeague.get(lg.id)?.length ?? 0}
                    </span>
                  </button>
                ))}
              </div>

              {/* Контент активной лиги */}
              {activeLeagueTab && (() => {
                const lgTeams = teamsPerLeague.get(activeLeagueTab) ?? []
                const poolFiltered = allTeams.filter(pt => !lgTeams.some(t => t.name === pt.name))
                return (
                  <div className="space-y-3">
                    {/* Команды в лиге */}
                    {lgTeams.length === 0 && (
                      <p className="text-gray-500 text-sm text-center py-4">Команд пока нет</p>
                    )}
                    <div className="space-y-2">
                      {lgTeams.map(team => (
                        <div key={team.id} className="flex items-center gap-3 bg-gray-800 rounded-lg px-3 py-2.5 border border-gray-700">
                          <div className="w-7 h-7 rounded-full flex-shrink-0 overflow-hidden border-2" style={{ borderColor: team.color }}>
                            {team.logoUrl
                              ? <img src={team.logoUrl} alt="" className="w-full h-full object-cover" />
                              : <div className="w-full h-full" style={{ backgroundColor: team.color }} />
                            }
                          </div>
                          <span className="flex-1 text-white text-sm font-medium">{team.name}</span>
                          <button
                            onClick={() => handleRemoveTeam(activeLeagueTab, team.id)}
                            className="text-gray-500 hover:text-red-400 transition-colors p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Кнопки добавления */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setTeamFormLeague(activeLeagueTab); setShowPool(false) }}
                        className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
                      >
                        <Plus className="w-4 h-4" /> Новая команда
                      </button>
                      <button
                        onClick={() => {
                          setShowPool(!showPool)
                          setTeamFormLeague(null)
                          if (!showPool && allTeams.length === 0) loadTeamPool()
                        }}
                        className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
                      >
                        <Users className="w-4 h-4" /> Из базы
                      </button>
                    </div>

                    {/* Форма новой команды */}
                    {teamFormLeague === activeLeagueTab && (
                      <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 space-y-3">
                        <h4 className="text-sm font-semibold text-gray-300">Новая команда</h4>
                        <input
                          type="text"
                          value={newTeamName}
                          onChange={e => setNewTeamName(e.target.value)}
                          placeholder="Название команды"
                          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                        />
                        {/* Цвет */}
                        <div>
                          <p className="text-xs text-gray-400 mb-2">Цвет команды</p>
                          <div className="flex flex-wrap gap-2">
                            {COLOR_PALETTE.slice(0, 18).map(c => (
                              <button
                                key={c.hex}
                                onClick={() => setNewTeamColor(c.hex)}
                                className="w-7 h-7 rounded-full border-2 transition-all"
                                style={{
                                  backgroundColor: c.hex,
                                  borderColor: newTeamColor === c.hex ? 'white' : 'transparent',
                                  transform: newTeamColor === c.hex ? 'scale(1.2)' : 'scale(1)',
                                }}
                              />
                            ))}
                          </div>
                        </div>
                        {/* Логотип */}
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full border-2 overflow-hidden flex-shrink-0" style={{ borderColor: newTeamColor }}>
                            {newTeamLogoUrl
                              ? <img src={newTeamLogoUrl} alt="" className="w-full h-full object-cover" />
                              : <div className="w-full h-full" style={{ backgroundColor: newTeamColor }} />
                            }
                          </div>
                          <button
                            onClick={() => logoInputRef.current?.click()}
                            className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                          >
                            {uploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                            {newTeamLogoUrl ? 'Заменить логотип' : 'Загрузить логотип'}
                          </button>
                          <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                          {newTeamLogoUrl && (
                            <button onClick={() => setNewTeamLogoUrl(null)} className="text-xs text-gray-500 hover:text-red-400">✕</button>
                          )}
                        </div>
                        {step3Error && <p className="text-red-400 text-xs">{step3Error}</p>}
                        <div className="flex gap-2">
                          <button
                            onClick={() => setTeamFormLeague(null)}
                            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-sm py-2.5 rounded-lg transition-colors"
                          >
                            Отмена
                          </button>
                          <button
                            onClick={() => handleAddTeam(activeLeagueTab)}
                            disabled={addingTeam}
                            className="flex-1 bg-emerald-700 hover:bg-emerald-600 disabled:bg-gray-700 text-white text-sm py-2.5 rounded-lg flex items-center justify-center gap-1 transition-colors"
                          >
                            {addingTeam ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Добавить'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Пул существующих команд */}
                    {showPool && (
                      <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-gray-300 mb-3">Команды из базы</h4>
                        {loadingPool && <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-emerald-400" /></div>}
                        {!loadingPool && poolFiltered.length === 0 && (
                          <p className="text-gray-500 text-sm text-center py-2">Нет доступных команд</p>
                        )}
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {poolFiltered.map(pt => (
                            <div key={pt.id} className="flex items-center gap-2 bg-gray-900/60 rounded-lg px-3 py-2">
                              <div className="w-6 h-6 rounded-full flex-shrink-0 overflow-hidden" style={{ backgroundColor: pt.color }}>
                                {pt.logoUrl && <img src={pt.logoUrl} alt="" className="w-full h-full object-cover" />}
                              </div>
                              <span className="flex-1 text-white text-sm">{pt.name}</span>
                              <button
                                onClick={() => handleAddFromPool(activeLeagueTab, pt)}
                                disabled={addingTeam}
                                className="text-xs bg-emerald-700 hover:bg-emerald-600 disabled:bg-gray-700 text-white px-3 py-1 rounded-md transition-colors"
                              >
                                + Добавить
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}

              {step3Error && <p className="text-red-400 text-sm">{step3Error}</p>}

              <button
                onClick={handleFinish}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors mt-4"
              >
                <Check className="w-5 h-5" /> Сохранить сезон
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Подтверждение отмены */}
      {cancelConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-2">Отменить создание?</h3>
            <p className="text-gray-400 text-sm mb-5">Все созданные данные (сезон, лиги, команды) будут удалены.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelConfirm(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-lg transition-colors"
              >
                Продолжить
              </button>
              <button
                onClick={handleConfirmCancel}
                className="flex-1 bg-red-700 hover:bg-red-600 text-white py-2.5 rounded-lg transition-colors"
              >
                Отменить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
