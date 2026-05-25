/**
 * AdminPanelPage — полностью переработанная иерархическая панель управления.
 *
 * Структура: Сезоны → Лиги → Команды (всё вложено)
 * + Кнопка «Создать новый сезон» открывает пошаговый SeasonWizard
 */

import { useState } from 'react'
import {
  Plus, Trash2, ChevronDown, ChevronUp, Loader2, Edit2, X, Check,
  Archive, Star, Users, Shield,
} from 'lucide-react'
import { useData } from '../context/DataContext'
import type { UpdateLeagueArgs } from '../context/DataContext'
import { useLeagues } from '../hooks/useLeagues'
import { useTeamsWithPlayers } from '../hooks/useTeams'
import { useDialogs } from '../components/DialogsContext'
import { Spinner } from '../components/Spinner'
import { TeamEditModal } from '../components/TeamEditModal'
import { SeasonWizard } from '../components/SeasonWizard'
import type { Season, League, TeamWithPlayers } from '../types/database'
import { COLOR_PALETTE } from '../constants/colors'
import { supabase } from '../lib/supabase'
import { generateUUID } from '../lib/uuid'

// ─────────────────────────────────────────────────────────────────────────────
// TeamRow
// ─────────────────────────────────────────────────────────────────────────────

function TeamRow({
  team,
  onEdit,
  onDelete,
}: {
  team: TeamWithPlayers
  onEdit: (team: TeamWithPlayers) => void
  onDelete: (teamId: string, name: string) => void
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-gray-800/40 rounded-xl border border-gray-700/50 hover:border-gray-600/80 transition-colors group">
      {/* Логотип */}
      <div
        className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden border-2"
        style={{ borderColor: team.color }}
      >
        {team.logo_url
          ? <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full" style={{ backgroundColor: team.color }} />
        }
      </div>
      {/* Название */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium text-sm truncate">{team.name}</p>
        <p className="text-gray-500 text-xs flex items-center gap-1 mt-0.5">
          <Users className="w-3 h-3" />
          {team.players.length} игр.
        </p>
      </div>
      {/* Действия */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(team)}
          className="p-1.5 text-gray-400 hover:text-emerald-400 hover:bg-gray-700 rounded-lg transition-colors"
          title="Редактировать команду"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(team.id, team.name)}
          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
          title="Удалить команду"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LeagueRow
// ─────────────────────────────────────────────────────────────────────────────

function LeagueRow({
  league,
  onLeagueDeleted,
}: {
  league: League
  onLeagueDeleted: () => void
}) {
  const { createTeam, deleteTeam, updateLeague } = useData()
  const { showConfirm, showToast } = useDialogs()
  const { teams, loading: loadingTeams, refetch: refetchTeams } = useTeamsWithPlayers(league.id)

  const [expanded, setExpanded] = useState(false)
  const [editingTeam, setEditingTeam] = useState<TeamWithPlayers | null>(null)

  // Редактирование названия лиги
  const [renamingLeague, setRenamingLeague] = useState(false)
  const [leagueName, setLeagueName] = useState(league.name)
  const [savingLeagueName, setSavingLeagueName] = useState(false)

  // Добавление команды
  const [showAddTeam, setShowAddTeam] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [newTeamColor, setNewTeamColor] = useState(COLOR_PALETTE[0].hex)
  const [addingTeam, setAddingTeam] = useState(false)
  const [teamError, setTeamError] = useState('')

  const handleSaveLeagueName = async () => {
    if (!leagueName.trim() || leagueName.trim() === league.name) {
      setRenamingLeague(false)
      setLeagueName(league.name)
      return
    }
    setSavingLeagueName(true)
    const { error } = await (updateLeague as (args: UpdateLeagueArgs) => Promise<{ error: string | null }>)({ leagueId: league.id, name: leagueName.trim() })
    setSavingLeagueName(false)
    if (error) { showToast(error, 'error'); return }
    setRenamingLeague(false)
    showToast('Лига переименована', 'success')
  }

  const handleDeleteLeague = () => {
    showConfirm({
      title: 'Удалить лигу?',
      message: `Лига «${league.name}» и все её команды будут удалены безвозвратно.`,
      confirmText: 'Удалить',
      isDangerous: true,
      onConfirm: async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any).from('leagues').delete().eq('id', league.id)
        if (error) { showToast(error.message, 'error'); return }
        showToast('Лига удалена', 'success')
        onLeagueDeleted()
      },
    })
  }

  const handleAddTeam = async () => {
    if (!newTeamName.trim()) { setTeamError('Введите название'); return }
    setAddingTeam(true)
    const id = generateUUID()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('teams').insert({ id, league_id: league.id, name: newTeamName.trim(), color: newTeamColor, logo_url: null })
    setAddingTeam(false)
    if (error) { setTeamError(error.message); return }
    refetchTeams()
    setNewTeamName('')
    setNewTeamColor(COLOR_PALETTE[0].hex)
    setShowAddTeam(false)
    setTeamError('')
  }

  const handleDeleteTeam = (teamId: string, name: string) => {
    showConfirm({
      title: 'Удалить команду?',
      message: `Команда «${name}» будет удалена безвозвратно.`,
      confirmText: 'Удалить',
      isDangerous: true,
      onConfirm: async () => {
        const { error } = await deleteTeam(teamId)
        if (error) { showToast(error, 'error'); return }
        refetchTeams()
        showToast('Команда удалена', 'success')
      },
    })
  }

  return (
    <>
      <div className="border border-gray-700/50 rounded-xl overflow-hidden">
        {/* Шапка лиги */}
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-800/60">
          <Shield className="w-4 h-4 text-emerald-500 flex-shrink-0" />

          {renamingLeague ? (
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={leagueName}
                onChange={e => setLeagueName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSaveLeagueName(); if (e.key === 'Escape') { setRenamingLeague(false); setLeagueName(league.name) } }}
                autoFocus
                className="flex-1 bg-gray-900 border border-emerald-500/50 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
              <button onClick={handleSaveLeagueName} disabled={savingLeagueName} className="text-emerald-400 hover:text-emerald-300 p-1">
                {savingLeagueName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </button>
              <button onClick={() => { setRenamingLeague(false); setLeagueName(league.name) }} className="text-gray-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              className="flex-1 text-left text-sm font-semibold text-gray-200 hover:text-white transition-colors"
              onClick={() => setExpanded(e => !e)}
            >
              {league.name}
              <span className="ml-2 text-xs text-gray-500 font-normal">{teams.length} команд</span>
            </button>
          )}

          {/* Действия */}
          {!renamingLeague && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => setRenamingLeague(true)}
                className="p-1.5 text-gray-500 hover:text-emerald-400 hover:bg-gray-700 rounded-lg transition-colors"
                title="Переименовать лигу"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleDeleteLeague}
                className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                title="Удалить лигу"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setExpanded(e => !e)}
                className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>

        {/* Команды */}
        {expanded && (
          <div className="px-3 pb-3 pt-2 bg-gray-900/40 space-y-2">
            {loadingTeams && <Spinner className="py-4" />}
            {!loadingTeams && teams.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-3">Команд нет</p>
            )}
            {teams.map(team => (
              <TeamRow
                key={team.id}
                team={team}
                onEdit={setEditingTeam}
                onDelete={handleDeleteTeam}
              />
            ))}

            {/* Форма добавления команды */}
            {showAddTeam ? (
              <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-3 space-y-2.5 mt-2">
                <input
                  type="text"
                  value={newTeamName}
                  onChange={e => setNewTeamName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddTeam()}
                  placeholder="Название команды"
                  autoFocus
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                />
                <div className="flex flex-wrap gap-1.5">
                  {COLOR_PALETTE.slice(0, 18).map(c => (
                    <button
                      key={c.hex}
                      onClick={() => setNewTeamColor(c.hex)}
                      className="w-6 h-6 rounded-full border-2 transition-transform"
                      style={{
                        backgroundColor: c.hex,
                        borderColor: newTeamColor === c.hex ? 'white' : 'transparent',
                        transform: newTeamColor === c.hex ? 'scale(1.25)' : 'scale(1)',
                      }}
                    />
                  ))}
                </div>
                {teamError && <p className="text-red-400 text-xs">{teamError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowAddTeam(false); setNewTeamName(''); setTeamError('') }}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-sm py-2 rounded-lg transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleAddTeam}
                    disabled={addingTeam}
                    className="flex-1 bg-emerald-700 hover:bg-emerald-600 disabled:bg-gray-700 text-white text-sm py-2 rounded-lg flex items-center justify-center gap-1 transition-colors"
                  >
                    {addingTeam ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Добавить'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddTeam(true)}
                className="w-full flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-emerald-400 border border-dashed border-gray-700 hover:border-emerald-600 rounded-xl py-2.5 transition-colors mt-1"
              >
                <Plus className="w-4 h-4" /> Добавить команду
              </button>
            )}
          </div>
        )}
      </div>

      {/* Модал редактирования команды */}
      {editingTeam && (
        <TeamEditModal
          team={editingTeam}
          onClose={() => setEditingTeam(null)}
          onSave={() => { setEditingTeam(null); refetchTeams() }}
          onRefetch={refetchTeams}
        />
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// AdminSeasonCard
// ─────────────────────────────────────────────────────────────────────────────

function AdminSeasonCard({ season, onSeasonDeleted }: { season: Season; onSeasonDeleted: () => void }) {
  const { updateSeason, deleteSeason, createLeague } = useData()
  const { showConfirm, showToast } = useDialogs()
  const { leagues, loading: loadingLeagues, refetch: refetchLeagues } = useLeagues(season.id)

  const [expanded, setExpanded] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [seasonName, setSeasonName] = useState(season.name)
  const [savingName, setSavingName] = useState(false)

  const [showAddLeague, setShowAddLeague] = useState(false)
  const [newLeagueName, setNewLeagueName] = useState('')
  const [addingLeague, setAddingLeague] = useState(false)
  const [leagueError, setLeagueError] = useState('')

  const isActive = season.status === 'active'

  const handleSaveName = async () => {
    if (!seasonName.trim() || seasonName.trim() === season.name) {
      setRenaming(false); setSeasonName(season.name); return
    }
    setSavingName(true)
    const { error } = await updateSeason({ seasonId: season.id, name: seasonName.trim() })
    setSavingName(false)
    if (error) { showToast(error, 'error'); return }
    setRenaming(false)
    showToast('Сезон переименован', 'success')
  }

  const handleToggleStatus = () => {
    const newStatus = isActive ? 'archived' : 'active'
    const msg = isActive
      ? `Архивировать сезон «${season.name}»?`
      : `Активировать сезон «${season.name}»? Текущий активный сезон будет архивирован.`
    showConfirm({
      title: isActive ? 'Архивировать сезон?' : 'Активировать сезон?',
      message: msg,
      confirmText: isActive ? 'Архивировать' : 'Активировать',
      onConfirm: async () => {
        const { error } = await updateSeason({ seasonId: season.id, status: newStatus })
        if (error) showToast(error, 'error')
        else showToast(isActive ? 'Сезон архивирован' : 'Сезон активирован', 'success')
      },
    })
  }

  const handleDeleteSeason = () => {
    showConfirm({
      title: 'Удалить сезон?',
      message: `Сезон «${season.name}» и все вложенные данные будут удалены безвозвратно.`,
      confirmText: 'Удалить',
      isDangerous: true,
      onConfirm: async () => {
        const { error } = await deleteSeason(season.id)
        if (error) { showToast(error, 'error'); return }
        showToast('Сезон удалён', 'success')
        onSeasonDeleted()
      },
    })
  }

  const handleAddLeague = async () => {
    if (!newLeagueName.trim()) { setLeagueError('Введите название'); return }
    setAddingLeague(true)
    const { error } = await createLeague({ seasonId: season.id, name: newLeagueName.trim(), sortOrder: leagues.length })
    setAddingLeague(false)
    if (error) { setLeagueError(error); return }
    refetchLeagues()
    setNewLeagueName('')
    setShowAddLeague(false)
    setLeagueError('')
    showToast('Лига добавлена', 'success')
  }

  return (
    <div
      className={`rounded-2xl border overflow-hidden transition-colors ${
        isActive
          ? 'border-emerald-600/40 bg-emerald-950/10'
          : 'border-gray-700/50 bg-gray-900/20'
      }`}
    >
      {/* Шапка сезона */}
      <div
        className={`flex items-center gap-3 px-5 py-4 ${isActive ? 'bg-emerald-900/10' : 'bg-gray-800/40'}`}
      >
        {/* Иконка статуса */}
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isActive ? 'bg-emerald-500/20' : 'bg-gray-700/40'
        }`}>
          {isActive
            ? <Star className="w-5 h-5 text-emerald-400" />
            : <Archive className="w-5 h-5 text-gray-400" />
          }
        </div>

        {/* Название */}
        {renaming ? (
          <div className="flex-1 flex items-center gap-2">
            <input
              type="text"
              value={seasonName}
              onChange={e => setSeasonName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') { setRenaming(false); setSeasonName(season.name) } }}
              autoFocus
              className="flex-1 bg-gray-900 border border-emerald-500/50 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500"
            />
            <button onClick={handleSaveName} disabled={savingName} className="text-emerald-400 hover:text-emerald-300 p-1">
              {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            </button>
            <button onClick={() => { setRenaming(false); setSeasonName(season.name) }} className="text-gray-400 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            className="flex-1 text-left"
            onClick={() => setExpanded(e => !e)}
          >
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">{season.name}</span>
              {isActive && (
                <span className="text-xs bg-emerald-600/30 text-emerald-400 px-2 py-0.5 rounded-full font-medium border border-emerald-600/30">
                  Активный
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{leagues.length} лиг · {season.year}</p>
          </button>
        )}

        {/* Действия */}
        {!renaming && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setRenaming(true)}
              className="p-1.5 text-gray-400 hover:text-emerald-400 hover:bg-gray-700 rounded-lg transition-colors"
              title="Переименовать"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleToggleStatus}
              className={`p-1.5 hover:bg-gray-700 rounded-lg transition-colors ${
                isActive
                  ? 'text-gray-400 hover:text-orange-400'
                  : 'text-gray-400 hover:text-emerald-400'
              }`}
              title={isActive ? 'Архивировать' : 'Активировать'}
            >
              {isActive ? <Archive className="w-4 h-4" /> : <Star className="w-4 h-4" />}
            </button>
            <button
              onClick={handleDeleteSeason}
              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
              title="Удалить сезон"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setExpanded(e => !e)}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        )}
      </div>

      {/* Лиги */}
      {expanded && (
        <div className="px-4 pb-4 pt-3 space-y-2">
          {loadingLeagues && <Spinner className="py-4" />}
          {!loadingLeagues && leagues.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-3">Лиг нет</p>
          )}
          {leagues.map(league => (
            <LeagueRow
              key={league.id}
              league={league}
              onLeagueDeleted={refetchLeagues}
            />
          ))}

          {/* Добавить лигу */}
          {showAddLeague ? (
            <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-3 space-y-2.5 mt-2">
              <input
                type="text"
                value={newLeagueName}
                onChange={e => setNewLeagueName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddLeague()}
                placeholder="Название лиги"
                autoFocus
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              />
              {leagueError && <p className="text-red-400 text-xs">{leagueError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowAddLeague(false); setNewLeagueName(''); setLeagueError('') }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-sm py-2 rounded-lg transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleAddLeague}
                  disabled={addingLeague}
                  className="flex-1 bg-emerald-700 hover:bg-emerald-600 disabled:bg-gray-700 text-white text-sm py-2 rounded-lg flex items-center justify-center gap-1 transition-colors"
                >
                  {addingLeague ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Добавить'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddLeague(true)}
              className="w-full flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-emerald-400 border border-dashed border-gray-700 hover:border-emerald-600 rounded-xl py-2.5 transition-colors"
            >
              <Plus className="w-4 h-4" /> Добавить лигу
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// AdminPanelPage (главный компонент)
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminPanelPage() {
  const { seasons, loadingSeasons, refetchSeasons } = useData()
  const [showWizard, setShowWizard] = useState(false)

  if (loadingSeasons) return <Spinner className="py-12" />

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* Заголовок + кнопка */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-white">Управление</h2>
        <button
          onClick={() => setShowWizard(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-emerald-900/30"
        >
          <Plus className="w-4 h-4" />
          Новый сезон
        </button>
      </div>

      {/* Список сезонов */}
      {seasons.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">🏆</p>
          <p className="font-medium">Сезонов нет</p>
          <p className="text-sm mt-1">Нажмите «Новый сезон» чтобы начать</p>
        </div>
      )}
      <div className="space-y-3">
        {seasons.map(season => (
          <AdminSeasonCard
            key={season.id}
            season={season}
            onSeasonDeleted={refetchSeasons}
          />
        ))}
      </div>

      {/* Мастер создания сезона */}
      {showWizard && (
        <SeasonWizard onClose={() => { setShowWizard(false); refetchSeasons() }} />
      )}
    </div>
  )
}
