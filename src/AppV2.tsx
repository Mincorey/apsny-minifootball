import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import {
  Trophy,
  Users,
  Calendar,
  ListOrdered,
  LayoutDashboard,
  Shield,
  Star,
  ClipboardList,
  Settings2,
} from 'lucide-react'
import { useData } from './context/DataContext'
import { useAuth } from './context/AuthContext'
import { useDialogs } from './components/DialogsContext'
import { Spinner } from './components/Spinner'
import { MatchResultModal } from './components/MatchResultModal'
import { AdminLoginModal } from './components/AdminLoginModal'
import { TeamEditModal } from './components/TeamEditModal'
import { StandingsPage } from './pages/StandingsPage'
import { ScorersPage } from './pages/ScorersPage'
import { SchedulePage } from './pages/SchedulePage'
import { ToursPage } from './pages/ToursPage'
import { TeamsPage } from './pages/TeamsPage'
import { MatchEntryPage } from './pages/MatchEntryPage'
import { AdminPanelPage } from './pages/AdminPanelPage'
import { Empty } from './components/ui/Empty'
import { ADMIN_LOGIN, ADMIN_PASSWORD_HASH } from './constants'
import type { TeamWithPlayers, Match } from './types/database'

type Tab = 'table' | 'scorers' | 'schedule' | 'tours' | 'teams' | 'match-entry' | 'admin'

// Вкладка 'match-entry' и 'admin' добавляются динамически только для админов (см. visibleTabs)
const ALL_TABS: { id: Tab; label: string; icon: typeof Trophy; adminOnly?: boolean }[] = [
  { id: 'table',       label: 'Таблица',      icon: LayoutDashboard },
  { id: 'scorers',     label: 'Бомбардиры',   icon: Star },
  { id: 'schedule',    label: 'Расписание',   icon: Calendar },
  { id: 'tours',       label: 'Туры',         icon: ListOrdered },
  { id: 'teams',       label: 'Команды',      icon: Users },
  { id: 'match-entry', label: 'Итоги матча',  icon: ClipboardList, adminOnly: true },
  { id: 'admin',       label: 'Управление',   icon: Settings2,     adminOnly: true },
]

export default function AppV2() {
  const {
    season, leagues, selectedLeague, selectLeague,
    teams, matches, standings, scorers,
    loadingSeasons, loadingLeagues, loadingTeams,
    loadingMatches, loadingStandings, loadingScorers,
    errorSeasons, errorLeagues, errorTeams,
    errorMatches, errorStandings, errorScorers,
    hasError,
    refetchTeams, refetchMatches, refetchStandings, refetchScorers,
    refetchSeasons, refetchLeagues,
  } = useData()

  const { showToast } = useDialogs()
  const { isAdmin: isSupabaseAdmin } = useAuth()
  const [isAdminMode, setIsAdminMode] = useState(() => {
    return localStorage.getItem('adminSessionToken') === 'authenticated'
  })

  const [activeTab,   setActiveTab]   = useState<Tab>('table')
  const [resultMatch, setResultMatch] = useState<Match | null>(null)
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false)
  const [editingTeam, setEditingTeam] = useState<typeof teams[0] | null>(null)

  const isAdmin = isAdminMode || isSupabaseAdmin

  // Только нужные вкладки в зависимости от роли
  const visibleTabs = ALL_TABS.filter(t => !t.adminOnly || isAdmin)

  const clickCount    = useRef(0)
  const lastClickTime = useRef(0)
  const lastErrorRef  = useRef<string | null>(null)

  useEffect(() => {
    const currentError = errorSeasons || errorLeagues || errorTeams || errorMatches || errorStandings || errorScorers
    if (currentError && currentError !== lastErrorRef.current) {
      lastErrorRef.current = currentError
      showToast(`Ошибка: ${currentError}`, 'error', 5000)
    }
  }, [errorSeasons, errorLeagues, errorTeams, errorMatches, errorStandings, errorScorers, showToast])

  const handleHeaderClick = () => {
    const now = Date.now()
    if (now - lastClickTime.current < 1000) {
      clickCount.current++
    } else {
      clickCount.current = 1
    }
    lastClickTime.current = now
    if (clickCount.current === 5) {
      setShowAdminLoginModal(true)
      clickCount.current = 0
    }
  }

  const teamMap = useMemo(() => new Map(teams.map(t => [t.id, t])), [teams])
  const isLoading = loadingSeasons || loadingLeagues

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-brand-bg)' }}>

      {/* Header */}
      <header className="glass-nav sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">

          {/* Top bar */}
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--color-brand-accent)', boxShadow: '0 0 14px rgba(0,117,49,0.40)' }}
              >
                <Trophy size={18} className="text-white" />
              </div>
              <div
                className="cursor-pointer select-none min-w-0"
                onClick={handleHeaderClick}
                title="5 кликов для входа администратора"
              >
                <h1
                  className="text-sm sm:text-base font-bold leading-tight truncate transition-colors hover:text-green-400"
                  style={{ color: 'var(--color-brand-text)' }}
                >
                  Чемпионат Абхазии
                </h1>
                <p className="label-caps text-[10px] truncate" style={{ color: 'var(--color-brand-text-muted)' }}>
                  {isLoading ? '...' : season?.name ?? 'Мини-футбол'}
                </p>
              </div>
            </div>

            {/* League selector desktop */}
            {!isLoading && leagues.length > 0 && (
              <div className="hidden sm:flex gap-1.5">
                {leagues.map(l => (
                  <button
                    key={l.id}
                    onClick={() => selectLeague(l)}
                    className="label-caps text-[10px] px-3 py-1 rounded-full transition-all"
                    style={
                      selectedLeague?.id === l.id
                        ? { background: 'var(--color-brand-accent)', color: '#fff' }
                        : { background: 'rgba(255,255,255,0.07)', color: 'var(--color-brand-text-muted)' }
                    }
                  >
                    {l.name}
                  </button>
                ))}
              </div>
            )}

            {/* Admin badge */}
            {isAdmin && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span
                  className="label-caps text-[10px] px-3 py-1 rounded-lg"
                  style={{ background: 'rgba(0,117,49,0.15)', color: 'var(--color-brand-primary)' }}
                >
                  🔐 Админ
                </span>
                <button
                  onClick={() => { localStorage.removeItem('adminSessionToken'); setIsAdminMode(false) }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors"
                  style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}
                  title="Выход"
                >
                  x
                </button>
              </div>
            )}
          </div>

          {/* League selector mobile */}
          {!isLoading && leagues.length > 0 && (
            <div className="flex gap-1.5 pb-2 sm:hidden">
              {leagues.map(l => (
                <button
                  key={l.id}
                  onClick={() => selectLeague(l)}
                  className="label-caps text-[10px] px-3 py-1 rounded-full transition-all"
                  style={
                    selectedLeague?.id === l.id
                      ? { background: 'var(--color-brand-accent)', color: '#fff' }
                      : { background: 'rgba(255,255,255,0.07)', color: 'var(--color-brand-text-muted)' }
                  }
                >
                  {l.name}
                </button>
              ))}
            </div>
          )}

          {/* Nav tabs */}
          <div className="flex gap-1 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {visibleTabs.map(tab => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base font-semibold whitespace-nowrap transition-all duration-200 rounded-xl flex-shrink-0 active:scale-95"
                  style={active ? {
                    color: '#003914',
                    background: 'var(--color-brand-primary)',
                    boxShadow: '0 0 14px rgba(122,219,138,0.30)',
                  } : {
                    color: 'var(--color-brand-text-muted)',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      e.currentTarget.style.color = 'var(--color-brand-text)'
                      e.currentTarget.style.background = 'rgba(255,255,255,0.10)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      e.currentTarget.style.color = 'var(--color-brand-text-muted)'
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                    }
                  }}
                >
                  <Icon size={16} />
                  {tab.label}
                  {/* Маркер «только для админа» */}
                  {tab.adminOnly && !active && (
                    <span
                      className="ml-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: 'var(--color-brand-primary)', opacity: 0.7 }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-10">

        {hasError && (
          <div
            className="mb-5 p-4 rounded-xl flex items-center justify-between gap-3"
            style={{ background: 'rgba(147,0,10,0.15)', border: '1px solid rgba(255,180,171,0.20)' }}
          >
            <span className="text-sm" style={{ color: '#ffb4ab' }}>
              Ошибка загрузки. Проверьте соединение.
            </span>
            <button
              onClick={() => {
                refetchSeasons()
                refetchLeagues()
                refetchTeams()
                refetchMatches()
                refetchStandings()
                refetchScorers()
              }}
              className="flex-shrink-0 label-caps text-[10px] px-3 py-1.5 rounded-lg transition"
              style={{ background: 'rgba(147,0,10,0.25)', color: '#ffb4ab' }}
            >
              Повторить
            </button>
          </div>
        )}

        {isLoading ? (
          <Spinner className="py-24" />
        ) : !selectedLeague ? (
          <Empty text="Выберите лигу" />
        ) : (
          <>
            {activeTab === 'table'    && <StandingsPage standings={standings} loading={loadingStandings} error={errorStandings} leagueName={selectedLeague.name} seasonName={season?.name} />}
            {activeTab === 'scorers'  && <ScorersPage   scorers={scorers}     loading={loadingScorers}   error={errorScorers} />}
            {activeTab === 'schedule' && (
              <SchedulePage
                matches={matches}
                teams={teams}
                loading={loadingMatches || loadingTeams}
                isAdmin={isAdmin}
                onEnterResult={setResultMatch}
                error={errorMatches || errorTeams}
              />
            )}
            {activeTab === 'tours' && <ToursPage matches={matches} teams={teams} loading={loadingMatches || loadingTeams} error={errorMatches || errorTeams} />}
            {activeTab === 'teams' && <TeamsPage teams={teams} loading={loadingTeams} isAdmin={isAdmin} onEditTeam={setEditingTeam} error={errorTeams} />}
            {activeTab === 'match-entry' && isAdmin && (
              <MatchEntryPage
                leagueName={selectedLeague.name}
                seasonName={season?.name}
              />
            )}
            {activeTab === 'admin' && isAdmin && (
              <AdminPanelPage seasonName={season?.name} />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-5xl mx-auto px-4">
          <p className="label-caps text-[11px]" style={{ color: 'var(--color-brand-outline)' }}>
            APSNY Mini-Football Championship | 2026.
          </p>
          <p className="label-caps text-[11px] mt-1" style={{ color: 'var(--color-brand-outline)' }}>
            Заказать приложение{' '}
            <a
              href="https://t.me/Mincorey"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:brightness-125"
              style={{ color: 'var(--color-brand-primary)' }}
            >
              @Mincorey
            </a>
          </p>
        </div>
      </footer>

      {/* Modals */}
      <AdminLoginModal
        isOpen={showAdminLoginModal}
        onClose={() => setShowAdminLoginModal(false)}
        onSuccess={() => {}}
        correctLogin={ADMIN_LOGIN}
        correctPasswordHash={ADMIN_PASSWORD_HASH}
      />

      {resultMatch && (() => {
        const teamA = teamMap.get(resultMatch.team_a_id)
        const teamB = teamMap.get(resultMatch.team_b_id)
        if (!teamA || !teamB) return null
        return (
          <MatchResultModal
            match={resultMatch}
            teamA={teamA}
            teamB={teamB}
            onClose={() => setResultMatch(null)}
          />
        )
      })()}

      <TeamEditModal
        team={editingTeam}
        onClose={() => setEditingTeam(null)}
        onRefetch={refetchTeams}
        onSave={() => setEditingTeam(null)}
      />
    </div>
  )
}
