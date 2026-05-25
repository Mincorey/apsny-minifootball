import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import {
  Trophy,
  Users,
  Calendar,
  ListOrdered,
  LayoutDashboard,
  Star,
  ClipboardList,
  Settings2,
} from 'lucide-react'
import { useData } from './context/DataContext'
import { useAuth } from './context/AuthContext'
import { useDialogs } from './components/DialogsContext'
import { Spinner } from './components/Spinner'
import { MatchResultModal } from './components/MatchResultModal'
import { MatchDetailModal } from './components/MatchDetailModal'
import { sortStandingsWithH2H } from './utils/sortStandings'
import { AdminLoginModal } from './components/AdminLoginModal'
import { TeamEditModal } from './components/TeamEditModal'
import { SplashScreen } from './components/SplashScreen'
import { StandingsPage } from './pages/StandingsPage'
import { ScorersPage } from './pages/ScorersPage'
import { SchedulePage } from './pages/SchedulePage'
import { ToursPage } from './pages/ToursPage'
import { TeamsPage } from './pages/TeamsPage'
import { MatchEntryPage } from './pages/MatchEntryPage'
import { AdminPanelPage } from './pages/AdminPanelPage'
import { Empty } from './components/ui/Empty'
import { ADMIN_LOGIN, ADMIN_PASSWORD_HASH } from './constants'
import type { Match } from './types/database'

type Tab = 'table' | 'scorers' | 'schedule' | 'tours' | 'teams' | 'match-entry' | 'admin'

const ALL_TABS: { id: Tab; label: string; icon: typeof Trophy; adminOnly?: boolean }[] = [
  { id: 'table',       label: 'Таблица',     icon: LayoutDashboard },
  { id: 'scorers',     label: 'Бомбардиры',  icon: Star },
  { id: 'schedule',    label: 'Расписание',  icon: Calendar },
  { id: 'tours',       label: 'Туры',        icon: ListOrdered },
  { id: 'teams',       label: 'Команды',     icon: Users },
  { id: 'match-entry', label: 'Итоги матча', icon: ClipboardList, adminOnly: true },
  { id: 'admin',       label: 'Управление',  icon: Settings2,     adminOnly: true },
]

export default function AppV2() {
  const {
    seasons, season, leagues, selectedLeague, selectLeague, selectSeason,
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
  const [isAdminMode, setIsAdminMode] = useState(() =>
    localStorage.getItem('adminSessionToken') === 'authenticated'
  )

  const [showSplash,          setShowSplash]          = useState(true)
  const [activeTab,           setActiveTab]           = useState<Tab>('table')
  const [resultMatch,         setResultMatch]         = useState<Match | null>(null)
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false)
  const [editingTeam,         setEditingTeam]         = useState<typeof teams[0] | null>(null)
  const [detailMatch,        setDetailMatch]        = useState<Match | null>(null)

  const handleSplashDone = useCallback(() => setShowSplash(false), [])

  const isAdmin    = isAdminMode || isSupabaseAdmin
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
    if (now - lastClickTime.current < 1000) clickCount.current++
    else clickCount.current = 1
    lastClickTime.current = now
    if (clickCount.current === 5) {
      setShowAdminLoginModal(true)
      clickCount.current = 0
    }
  }

  const teamMap       = useMemo(() => new Map(teams.map(t => [t.id, t])), [teams])
  const sortedStandings = useMemo(() => sortStandingsWithH2H(standings, matches), [standings, matches])
  const isLoading = loadingSeasons || loadingLeagues

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-brand-bg)' }}>

      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <header className="glass-nav sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 space-y-2.5">

          {/* ROW 1 */}
          <div className="flex flex-col items-center gap-2">
            <div
              className="flex items-center gap-3 cursor-pointer select-none"
              onClick={handleHeaderClick}
              title="5 кликов для входа администратора"
            >
              <div
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--color-brand-accent)', boxShadow: '0 0 18px rgba(0,117,49,0.50)' }}
              >
                <Trophy size={26} className="text-white" />
              </div>
              <h1
                className="text-lg sm:text-xl font-extrabold leading-snug hover:text-green-400 transition-colors text-center"
                style={{ color: 'var(--color-brand-text)' }}
              >
                Чемпионат Абхазии<br className="sm:hidden" /> по мини-футболу
              </h1>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2.5">
                <span
                  className="text-sm font-semibold px-4 py-2 rounded-xl"
                  style={{ background: 'rgba(0,117,49,0.18)', color: 'var(--color-brand-primary)' }}
                >
                  🔐 Админ
                </span>
                <button
                  onClick={() => { localStorage.removeItem('adminSessionToken'); setIsAdminMode(false) }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                  style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}
                  title="Выйти из режима администратора"
                >
                  ✕ Выйти
                </button>
              </div>
            )}
          </div>

          {/* ROW 2: Season switcher */}
          {!isLoading && (() => {
            const visibleSeasons = seasons.filter(s => s.status !== 'archived')
            if (visibleSeasons.length <= 1) return null
            return (
              <div className="flex justify-center gap-1.5 flex-wrap">
                {visibleSeasons.map(s => (
                  <button
                    key={s.id}
                    onClick={() => selectSeason(s)}
                    className="label-caps text-[10px] px-3 py-1 rounded-full font-semibold transition-all flex items-center gap-1"
                    style={
                      season?.id === s.id
                        ? { background: 'rgba(0,117,49,0.28)', color: 'var(--color-brand-primary)', border: '1px solid rgba(122,219,138,0.30)' }
                        : { background: 'rgba(255,255,255,0.05)', color: 'var(--color-brand-text-muted)', border: '1px solid rgba(255,255,255,0.08)' }
                    }
                  >
                    {s.name}
                    {s.status === 'active' && (
                      <span className="text-[8px]" style={{ color: 'var(--color-brand-primary)', opacity: 0.8 }}>●</span>
                    )}
                    {s.status === 'finished' && (
                      <span className="text-[8px]" style={{ color: '#93c5fd', opacity: 0.8 }}>🏆</span>
                    )}
                  </button>
                ))}
              </div>
            )
          })()}

          {/* ROW 3: League buttons */}
          {!isLoading && leagues.length > 0 && (
            <div className="flex justify-center gap-2">
              {leagues.map(l => (
                <button
                  key={l.id}
                  onClick={() => selectLeague(l)}
                  className="label-caps text-[11px] sm:text-xs px-4 sm:px-5 py-1.5 rounded-full font-semibold transition-all"
                  style={
                    selectedLeague?.id === l.id
                      ? { background: 'var(--color-brand-accent)', color: '#fff', boxShadow: '0 0 10px rgba(0,117,49,0.35)' }
                      : { background: 'rgba(255,255,255,0.07)', color: 'var(--color-brand-text-muted)', border: '1px solid rgba(255,255,255,0.10)' }
                  }
                >
                  {l.name}
                </button>
              ))}
            </div>
          )}

          {/* ROW 4: Navigation tabs */}
          <div className="flex gap-0.5 sm:gap-1 sm:justify-center sm:overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {visibleTabs.map(tab => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex-1 sm:flex-none sm:flex-shrink-0 flex items-center justify-center sm:justify-start gap-1.5 sm:px-3 py-3 sm:py-2 sm:text-xs text-sm font-semibold whitespace-nowrap transition-all duration-200 rounded-xl active:scale-95"
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
                  title={tab.label}
                >
                  <Icon size={16} />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.adminOnly && !active && (
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: 'var(--color-brand-primary)', opacity: 0.7 }}
                    />
                  )}
                </button>
              )
            })}
          </div>

        </div>
      </header>

      {/* ── Main ────────────────────────────────────────────────────────────────── */}
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
              onClick={() => { refetchSeasons(); refetchLeagues(); refetchTeams(); refetchMatches(); refetchStandings(); refetchScorers() }}
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
          <div key={activeTab} className="page-enter">
            {activeTab === 'table'    && <StandingsPage standings={sortedStandings} loading={loadingStandings} error={errorStandings} leagueName={selectedLeague.name} />}
            {activeTab === 'scorers'  && <ScorersPage   scorers={scorers}     loading={loadingScorers}   error={errorScorers} />}
            {activeTab === 'schedule' && (
              <SchedulePage
                isAdmin={isAdmin}
                onEnterResult={setResultMatch}
              />
            )}
            {activeTab === 'tours'       && <ToursPage      matches={matches} teams={teams} loading={loadingMatches || loadingTeams} error={errorMatches || errorTeams} onMatchClick={setDetailMatch} />}
            {activeTab === 'teams'       && <TeamsPage       teams={teams}     loading={loadingTeams} isAdmin={isAdmin} onEditTeam={setEditingTeam} error={errorTeams} />}
            {activeTab === 'match-entry' && isAdmin && <MatchEntryPage leagueName={selectedLeague.name} />}
            {activeTab === 'admin'       && isAdmin && <AdminPanelPage />}
          </div>
        )}
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────────────── */}
      <footer className="py-6 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-5xl mx-auto px-4">
          <p className="label-caps text-[11px]" style={{ color: 'var(--color-brand-outline)' }}>
            APSNY Mini-Football Championship | 2026.
          </p>
          <p className="label-caps text-[11px] mt-1" style={{ color: 'var(--color-brand-outline)' }}>
            Заказать приложение{' '}
            <a href="https://t.me/Mincorey" target="_blank" rel="noopener noreferrer"
              className="transition-colors hover:brightness-125"
              style={{ color: 'var(--color-brand-primary)' }}>
              @Mincorey
            </a>
          </p>
        </div>
      </footer>

      {/* ── Modals ───────────────────────────────────────────────────────────────── */}
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


      {detailMatch && (() => {
        const teamA = teamMap.get(detailMatch.team_a_id)
        const teamB = teamMap.get(detailMatch.team_b_id)
        if (!teamA || !teamB) return null
        return (
          <MatchDetailModal
            match={detailMatch}
            teamA={teamA}
            teamB={teamB}
            onClose={() => setDetailMatch(null)}
          />
        )
      })()}

      {editingTeam && (
        <TeamEditModal
          team={editingTeam}
          onClose={() => setEditingTeam(null)}
          onRefetch={refetchTeams}
          onSave={() => setEditingTeam(null)}
        />
      )}

      {/* Splash screen */}
      {showSplash && <SplashScreen onDone={handleSplashDone} />}
    </div>
  )
}
