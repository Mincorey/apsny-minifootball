import type { TeamWithPlayers } from '../../types/database'

interface TeamLabelProps {
  team: TeamWithPlayers | undefined
  align: 'left' | 'right'
  size?: 'sm' | 'md'
}

export function TeamLabel({ team, align, size = 'md' }: TeamLabelProps) {
  if (!team) return <span className="text-gray-500 text-sm flex-1">—</span>

  const initials = team.name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const circleSize = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'

  return (
    <div className={`flex items-center gap-2.5 flex-1 min-w-0 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
      {/* Team logo circle */}
      <div
        className={`${circleSize} rounded-full flex-shrink-0 flex items-center justify-center font-bold border border-white/10`}
        style={{ backgroundColor: team.color ? `${team.color}33` : 'rgba(255,255,255,0.08)', borderColor: team.color ? `${team.color}66` : 'rgba(255,255,255,0.12)' }}
      >
        {team.logo_url ? (
          <img src={team.logo_url} alt={team.name} className="w-full h-full rounded-full object-cover" />
        ) : (
          <span style={{ color: team.color || '#7adb8a' }}>{initials}</span>
        )}
      </div>
      {/* Team name */}
      <span className={`${size === 'sm' ? 'text-xs' : 'text-sm'} font-semibold truncate ${align === 'right' ? 'text-right' : ''}`}
        style={{ color: 'var(--color-brand-text)' }}>
        {team.name}
      </span>
    </div>
  )
}
