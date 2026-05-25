import { useState } from 'react'
import { Users, ChevronDown, Pencil } from 'lucide-react'
import type { TeamWithPlayers } from '../types/database'
import { Spinner } from '../components/Spinner'
import { Empty } from '../components/ui/Empty'
import { PhotoModal } from '../components/PhotoModal'

interface PhotoView { src: string; name: string }

export function TeamsPage({ teams, loading, isAdmin, onEditTeam, error }: {
  teams: TeamWithPlayers[]
  loading: boolean
  isAdmin: boolean
  onEditTeam: (team: TeamWithPlayers) => void
  error?: string | null
}) {
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null)
  const [photoView, setPhotoView] = useState<PhotoView | null>(null)

  if (loading) return <Spinner className="py-20" />
  if (error)   return <Empty text={`Ошибка: ${error}`} />
  if (!teams.length) return <Empty text="Команды не найдены" />

  return (
    <>
      <div className="space-y-5">
        <h2 className="text-2xl sm:text-3xl font-extrabold" style={{ color: 'var(--color-brand-text)' }}>
          Команды
        </h2>

        <div className="flex flex-col gap-2">
          {teams.map(team => {
            const isExpanded = expandedTeamId === team.id
            const initials = team.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

            return (
              <div
                key={team.id}
                className="rounded-2xl overflow-hidden transition-all duration-200"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                {/* Header row */}
                <div
                  className="p-4 cursor-pointer hover:bg-white/[0.03] transition-colors"
                  onClick={() => setExpandedTeamId(isExpanded ? null : team.id)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden font-bold text-sm"
                        style={{
                          background: team.color ? `${team.color}33` : 'rgba(255,255,255,0.08)',
                          border: `2px solid ${team.color ?? 'rgba(255,255,255,0.15)'}`,
                          color: team.color ?? 'var(--color-brand-primary)',
                        }}
                      >
                        {team.logo_url
                          ? <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                          : initials
                        }
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-base truncate" style={{ color: 'var(--color-brand-text)' }}>
                          {team.name}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Users size={11} style={{ color: 'var(--color-brand-outline)' }} />
                          <span className="text-xs" style={{ color: 'var(--color-brand-text-muted)' }}>
                            {team.players.length}{' '}
                            {team.players.length === 1
                              ? 'игрок'
                              : team.players.length < 5
                              ? 'игрока'
                              : 'игроков'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div
                        className="w-1 h-10 rounded-full"
                        style={{ backgroundColor: team.color ?? 'rgba(255,255,255,0.2)' }}
                      />
                      {isAdmin && (
                        <button
                          onClick={e => { e.stopPropagation(); onEditTeam(team) }}
                          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/10 active:scale-95"
                          style={{ background: 'rgba(255,255,255,0.07)', color: 'var(--color-brand-outline)' }}
                          title="Редактировать команду"
                        >
                          <Pencil size={15} />
                        </button>
                      )}
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
                        style={{
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          color: isExpanded ? 'var(--color-brand-primary)' : 'var(--color-brand-outline)',
                          background: isExpanded ? 'rgba(122,219,138,0.10)' : 'rgba(255,255,255,0.05)',
                        }}
                      >
                        <ChevronDown size={20} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Player list */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)' }}>
                    {team.players.length === 0 ? (
                      <div className="py-5 text-center text-sm" style={{ color: 'var(--color-brand-outline)' }}>
                        Игроки не добавлены
                      </div>
                    ) : (
                      <div className="px-2 py-3 space-y-1">
                        {team.players.map((p: any) => (
                          <div
                            key={p.id}
                            className="flex items-center gap-3 py-2 px-1 rounded-lg transition-colors hover:bg-white/5"
                          >
                            {p.number != null
                              ? <div
                                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                                  style={{ background: 'rgba(255,255,255,0.10)' }}
                                >
                                  <span className="text-[11px] font-bold" style={{ color: 'var(--color-brand-text)' }}>
                                    {p.number}
                                  </span>
                                </div>
                              : <div className="w-7 h-7 flex-shrink-0" />
                            }

                            {/* Player photo - clickable if photo exists */}
                            <div
                              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                              style={{
                                background: 'rgba(255,255,255,0.08)',
                                border: '1px solid rgba(255,255,255,0.12)',
                                cursor: p.photo_url ? 'pointer' : 'default',
                                transition: 'opacity 0.15s',
                              }}
                              onClick={e => {
                                if (!p.photo_url) return
                                e.stopPropagation()
                                setPhotoView({ src: p.photo_url, name: p.name })
                              }}
                            >
                              {p.photo_url
                                ? <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" />
                                : <Users size={18} style={{ color: 'var(--color-brand-outline)' }} />
                              }
                            </div>

                            <div className="flex-1 min-w-0">
                              <span
                                className="block text-sm font-semibold truncate"
                                style={{
                                  color: p.permanent_ban ? '#f87171' : 'var(--color-brand-text)',
                                  textDecoration: p.permanent_ban ? 'line-through' : 'none',
                                  opacity: p.permanent_ban ? 0.6 : 1,
                                }}
                              >
                                {p.name}
                              </span>
                              {p.role && (
                                <span className="text-[10px] label-caps" style={{ color: 'var(--color-brand-text-muted)' }}>
                                  {p.role}
                                </span>
                              )}
                            </div>

                            {p.ban_matches > 0 && !p.permanent_ban && (
                              <span
                                className="label-caps text-[9px] px-1.5 py-0.5 rounded"
                                style={{ background: 'rgba(251,146,60,0.15)', color: '#fb923c' }}
                              >
                                -{p.ban_matches}
                              </span>
                            )}
                            {p.permanent_ban && (
                              <span
                                className="label-caps text-[9px] px-1.5 py-0.5 rounded"
                                style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}
                              >
                                БАН
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {photoView && (
        <PhotoModal
          src={photoView.src}
          name={photoView.name}
          onClose={() => setPhotoView(null)}
        />
      )}
    </>
  )
}
