import { useState, useRef } from 'react'
import { X, Loader2, Plus, Trash2, Edit2, Upload, ChevronDown } from 'lucide-react'
import type { TeamWithPlayers, Player } from '../types/database'
import { supabase } from '../lib/supabase'
import { uploadAndCompressImage, deleteImageFromStorage } from '../lib/imageUtils'
import { COLOR_PALETTE } from '../constants/colors'

interface Props {
  team: TeamWithPlayers | null
  onClose: () => void
  onSave: () => void
  onRefetch?: () => void
}

export function TeamEditModal({ team, onClose, onSave, onRefetch }: Props) {
  if (!team) return null

  const [teamName, setTeamName] = useState(team.name)
  const [teamColor, setTeamColor] = useState(team.color)
  const [teamLogoUrl, setTeamLogoUrl] = useState(team.logo_url || '')
  const [players, setPlayers] = useState<Player[]>(team.players)
  const [newPlayerName, setNewPlayerName] = useState('')
  const [newPlayerNumber, setNewPlayerNumber] = useState('')
  const [newPlayerPhotoUrl, setNewPlayerPhotoUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [isColorExpanded, setIsColorExpanded] = useState(false)
  const [newPlayerRole, setNewPlayerRole] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false)

  // Редактирование игрока
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null)
  const [editingPlayerName, setEditingPlayerName] = useState('')
  const [editingPlayerNumber, setEditingPlayerNumber] = useState('')
  const [editingPlayerPhotoUrl, setEditingPlayerPhotoUrl] = useState('')

  const logoInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const handleAddPlayer = async () => {
    if (!newPlayerName.trim()) {
      setError('Введите имя игрока')
      return
    }

    const playerNumber = newPlayerNumber ? parseInt(newPlayerNumber) : null

    const { error: insertErr } = await supabase
      .from('players')
      .insert({
        team_id: team.id,
        name: newPlayerName.trim(),
        number: playerNumber,
        photo_url: newPlayerPhotoUrl || null,
        role: newPlayerRole.trim() || null,
        permanent_ban: false,
        ban_matches: 0,
      })

    if (insertErr) {
      setError('Ошибка при добавлении игрока')
      return
    }

    setNewPlayerName('')
    setNewPlayerNumber('')
    setNewPlayerPhotoUrl('')
    setNewPlayerRole('')
    setShowAddForm(false)
    onRefetch?.()
    onSave()
  }

  const handleStartEditPlayer = (player: Player) => {
    setEditingPlayerId(player.id)
    setEditingPlayerName(player.name)
    setEditingPlayerNumber(player.number?.toString() || '')
    setEditingPlayerPhotoUrl(player.photo_url || '')
  }

  const handleSaveEditedPlayer = async () => {
    if (!editingPlayerId) return

    if (!editingPlayerName.trim()) {
      setError('Введите имя игрока')
      return
    }

    const playerNumber = editingPlayerNumber ? parseInt(editingPlayerNumber) : null

    const { error: updateErr } = await supabase
      .from('players')
      .update({
        name: editingPlayerName.trim(),
        number: playerNumber,
        photo_url: editingPlayerPhotoUrl || null,
      })
      .eq('id', editingPlayerId)

    if (updateErr) {
      setError('Ошибка при сохранении игрока')
      return
    }

    setPlayers(
      players.map((p) =>
        p.id === editingPlayerId
          ? {
              ...p,
              name: editingPlayerName.trim(),
              number: playerNumber,
              photo_url: editingPlayerPhotoUrl || null,
            }
          : p
      )
    )

    setEditingPlayerId(null)
    setEditingPlayerName('')
    setEditingPlayerNumber('')
    setEditingPlayerPhotoUrl('')
    onRefetch?.()
    onSave()
  }

  const handleDeletePlayer = async (playerId: string) => {
    const { error: delErr } = await supabase
      .from('players')
      .delete()
      .eq('id', playerId)

    if (delErr) {
      setError('Ошибка при удалении игрока')
      return
    }

    setPlayers(players.filter((p) => p.id !== playerId))
    onRefetch?.()
    onSave()
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    setError('')

    const timestamp = Date.now()
    const fileName = `team-${team.id}-${timestamp}.jpg`

    const result = await uploadAndCompressImage('team-logos', file, 'teams', fileName)

    if (result) {
      setTeamLogoUrl(result.url)
    } else {
      setError('Ошибка при загрузке логотипа')
    }

    setUploadingLogo(false)
  }

  const handlePlayerPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0]
    if (!file) return

    setUploadingPhoto(true)
    setError('')

    const timestamp = Date.now()
    const fileName = `player-${editingPlayerId || 'new'}-${timestamp}.jpg`

    const result = await uploadAndCompressImage('player-photos', file, 'players', fileName)

    if (result) {
      if (editingPlayerId) {
        setEditingPlayerPhotoUrl(result.url)
      } else {
        setNewPlayerPhotoUrl(result.url)
      }
    } else {
      setError('Ошибка при загрузке фото')
    }

    setUploadingPhoto(false)
  }

  const handleSaveTeam = async () => {
    if (!teamName.trim()) {
      setError('Введите имя команды')
      return
    }

    setIsLoading(true)
    setError('')

    const { error: updateErr } = await supabase
      .from('teams')
      .update({
        name: teamName.trim(),
        color: teamColor,
        logo_url: teamLogoUrl || null,
      })
      .eq('id', team.id)

    setIsLoading(false)

    if (updateErr) {
      setError('Ошибка при сохранении команды')
      return
    }

    onRefetch?.()
    onSave()
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in scale-in-95 duration-300 rounded-2xl custom-scrollbar">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl sticky top-0 z-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Редактирование команды</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
            >
              <X size={20} />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
              {error}
            </div>
          )}
        </div>

        <div className="bg-slate-900 border-x border-b border-slate-700 p-6 space-y-6">
          {/* Имя команды */}
          <div>
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 block">
              Имя команды
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-green-500/50 focus:bg-slate-800 transition-all"
            />
          </div>

          {/* Цвет команды — аккордеон с палитрой */}
          <div className="border border-slate-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setIsColorExpanded(!isColorExpanded)}
              className="w-full flex items-center justify-between gap-3 p-3 bg-slate-800/50 hover:bg-slate-800 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Цвет команды
                </span>
                <div
                  className="w-6 h-6 rounded-full border-2 border-slate-600 flex-shrink-0"
                  style={{ backgroundColor: teamColor }}
                />
              </div>
              <span className={`text-gray-400 transition-transform flex-shrink-0 ${isColorExpanded ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {isColorExpanded && (
              <div className="bg-slate-800/30 border-t border-slate-700 p-4">
                <div className="grid grid-cols-10 gap-2">
                  {COLOR_PALETTE.map((color) => (
                    <button
                      key={color.hex}
                      onClick={() => {
                        setTeamColor(color.hex)
                        setIsColorExpanded(false)
                      }}
                      title={color.name}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${
                        teamColor === color.hex
                          ? 'border-white shadow-lg scale-110'
                          : 'border-slate-600 hover:border-slate-400'
                      }`}
                      style={{ backgroundColor: color.hex }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Логотип команды */}
          <div>
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3 block">
              Логотип команды
            </label>
            <div className="flex items-center gap-4">
              {/* Превью логотипа */}
              <div className="w-32 h-32 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {teamLogoUrl ? (
                  <img
                    src={teamLogoUrl}
                    alt="Team logo"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span className="text-slate-500 text-sm text-center px-2">Логотип не загружен</span>
                )}
              </div>

              {/* Кнопки */}
              <div className="flex-1 flex flex-col gap-2">
                <button
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="w-full px-4 py-3 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {uploadingLogo ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Upload size={16} />
                  )}
                  {uploadingLogo ? 'Загрузка...' : teamLogoUrl ? 'Изменить логотип' : 'Загрузить логотип'}
                </button>
                {teamLogoUrl && (
                  <button
                    onClick={() => setTeamLogoUrl('')}
                    className="w-full px-4 py-2 bg-red-600/15 hover:bg-red-600/30 text-red-400 rounded-lg transition flex items-center justify-center gap-2 text-sm"
                  >
                    <Trash2 size={14} />
                    Удалить логотип
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
          </div>

          {/* Игроки */}
          <div>
            <h3 className="text-sm font-bold text-gray-300 mb-3">Игроки ({players.length})</h3>

            {/* Красивая прокрутка для списка */}
            <div className="bg-slate-800/30 rounded-lg max-h-48 overflow-y-auto space-y-1 p-2 mb-4 custom-scrollbar">
              {players.length === 0 ? (
                <div className="text-xs text-gray-500 py-4 text-center">Игроков нет</div>
              ) : (
                players.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between bg-slate-700/30 rounded-lg px-3 py-2 text-sm hover:bg-slate-700/50 transition"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {p.photo_url && (
                        <img
                          src={p.photo_url}
                          alt={p.name}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <span className="text-white truncate block">{p.name}</span>
                        {p.number && (
                          <span className="text-gray-400 text-xs">#{p.number}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleStartEditPlayer(p)}
                        className="p-1 text-gray-400 hover:text-blue-400 transition"
                        title="Редактировать"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeletePlayer(p.id)}
                        className="p-1 text-gray-400 hover:text-red-400 transition"
                        title="Удалить"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Если редактируем игрока */}
            {editingPlayerId && (
              <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-4 mb-4 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-blue-400 uppercase">Редактирование игрока</span>
                  <button
                    onClick={() => {
                      setEditingPlayerId(null)
                      setEditingPlayerName('')
                      setEditingPlayerNumber('')
                      setEditingPlayerPhotoUrl('')
                    }}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:brightness-125"
                    style={{ color: 'var(--color-brand-text-muted)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.18)' }}
                  >
                    Отмена
                  </button>
                </div>

                {/* Фото игрока */}
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-slate-700/50 border border-slate-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {editingPlayerPhotoUrl ? (
                      <img
                        src={editingPlayerPhotoUrl}
                        alt="Player"
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <span className="text-xs text-slate-500">Фото</span>
                    )}
                  </div>
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg text-xs transition disabled:opacity-50"
                  >
                    {uploadingPhoto ? 'Загрузка...' : editingPlayerPhotoUrl ? 'Изменить фото' : 'Фото'}
                  </button>
                  {editingPlayerPhotoUrl && (
                    <button
                      onClick={() => setEditingPlayerPhotoUrl('')}
                      className="p-2 bg-red-600/15 hover:bg-red-600/30 text-red-400 rounded-lg text-xs transition"
                      title="Удалить фото"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                {/* Поля редактирования */}
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editingPlayerName}
                    onChange={(e) => setEditingPlayerName(e.target.value)}
                    placeholder="Имя игрока"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-all"
                  />
                  <input
                    type="number"
                    value={editingPlayerNumber}
                    onChange={(e) => setEditingPlayerNumber(e.target.value)}
                    placeholder="№"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-all"
                  />
                </div>

                <button
                  onClick={handleSaveEditedPlayer}
                  className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
                >
                  Сохранить изменения
                </button>
              </div>
            )}

            {/* Добавить игрока */}
            <div className="border-t border-slate-700 pt-3">
              {!showAddForm ? (
                <button
                  onClick={() => setShowAddForm(true)}
                  disabled={editingPlayerId !== null}
                  className="w-full py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
                  style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px dashed rgba(34,197,94,0.30)' }}
                >
                  <Plus size={15} />
                  Добавить игрока
                </button>
              ) : (
                <div className="space-y-3 rounded-xl p-3" style={{ background: 'rgba(0,0,0,0.20)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#4ade80' }}>Новый игрок</p>

                  {/* Фото */}
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-slate-700/50 border border-slate-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {newPlayerPhotoUrl
                        ? <img src={newPlayerPhotoUrl} alt="New player" className="w-full h-full object-cover rounded-full" />
                        : <span className="text-xs text-slate-500">Фото</span>
                      }
                    </div>
                    <button
                      onClick={() => photoInputRef.current?.click()}
                      disabled={uploadingPhoto}
                      className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg text-xs transition disabled:opacity-50"
                    >
                      {uploadingPhoto ? 'Загрузка...' : newPlayerPhotoUrl ? 'Изменить фото' : 'Загрузить фото'}
                    </button>
                    {newPlayerPhotoUrl && (
                      <button
                        onClick={() => setNewPlayerPhotoUrl('')}
                        className="p-2 bg-red-600/15 hover:bg-red-600/30 text-red-400 rounded-lg text-xs transition"
                        title="Удалить фото"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  {/* Имя */}
                  <input
                    type="text"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    placeholder="Имя игрока"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-green-500/50 transition-all"
                  />

                  {/* Номер и роль */}
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={newPlayerNumber}
                      onChange={(e) => setNewPlayerNumber(e.target.value)}
                      placeholder="№"
                      className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-green-500/50 transition-all"
                    />
                    <div className="flex-1 relative">
                      <button
                        type="button"
                        onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all"
                        style={{
                          background: 'rgba(10,14,26,0.75)',
                          border: roleDropdownOpen ? '1px solid rgba(122,219,138,0.55)' : '1px solid rgba(255,255,255,0.12)',
                          color: newPlayerRole ? '#e2e8f0' : '#64748b',
                          boxShadow: roleDropdownOpen ? '0 0 0 2px rgba(122,219,138,0.10)' : 'none',
                        }}
                      >
                        <span>{newPlayerRole || 'Роль в команде'}</span>
                        <ChevronDown
                          size={14}
                          style={{
                            color: 'var(--color-brand-outline)',
                            transform: roleDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s',
                          }}
                        />
                      </button>
                      {roleDropdownOpen && (
                        <div
                          className="absolute z-20 w-full mt-1 rounded-xl overflow-hidden"
                          style={{ background: 'rgba(10,14,26,0.97)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 8px 28px rgba(0,0,0,0.55)' }}
                        >
                          {[
                            { value: '', label: 'Выберите роль' },
                            { value: 'Вратарь', label: 'Вратарь' },
                            { value: 'Защитник', label: 'Защитник' },
                            { value: 'Полузащитник', label: 'Полузащитник' },
                            { value: 'Нападающий', label: 'Нападающий' },
                            { value: 'Универсал', label: 'Универсал' },
                          ].map((opt) => (
                            <button
                              key={opt.value || '__empty__'}
                              type="button"
                              onClick={() => { setNewPlayerRole(opt.value); setRoleDropdownOpen(false) }}
                              className="w-full text-left px-3 py-2.5 text-sm transition-colors"
                              style={{
                                color: !opt.value ? '#64748b' : opt.value === newPlayerRole ? 'var(--color-brand-primary)' : '#e2e8f0',
                                background: opt.value === newPlayerRole ? 'rgba(122,219,138,0.10)' : 'transparent',
                              }}
                              onMouseEnter={(e) => { if (opt.value !== newPlayerRole) e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
                              onMouseLeave={(e) => { if (opt.value !== newPlayerRole) e.currentTarget.style.background = 'transparent' }}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Кнопки */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => { setShowAddForm(false); setNewPlayerName(''); setNewPlayerNumber(''); setNewPlayerRole(''); setNewPlayerPhotoUrl('') }}
                      className="flex-1 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition-colors"
                      style={{ background: 'rgba(255,255,255,0.05)' }}
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleAddPlayer}
                      disabled={!newPlayerName.trim()}
                      className="flex-1 py-2 rounded-lg text-sm font-bold transition-all active:scale-95 disabled:opacity-40"
                      style={{ background: 'rgba(34,197,94,0.80)', color: '#001a08' }}
                    >
                      Сохранить
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Кнопки действия */}
          <div className="flex gap-2 pt-4 border-t border-slate-700">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
            >
              Отмена
            </button>
            <button
              onClick={handleSaveTeam}
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg transition flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 size={14} className="animate-spin" />}
              {isLoading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </div>
      </div>

      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        onChange={handlePlayerPhotoUpload}
        className="hidden"
      />

      <style>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(34, 197, 94, 0.6) rgba(15, 23, 42, 0.3);
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.3);
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, rgba(34, 197, 94, 0.4), rgba(34, 197, 94, 0.8));
          border-radius: 4px;
          border: 2px solid rgba(15, 23, 42, 0.3);
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, rgba(34, 197, 94, 0.7), rgba(34, 197, 94, 1));
          border: 2px solid rgba(34, 197, 94, 0.5);
        }
      `}</style>
    </div>
  )
}
