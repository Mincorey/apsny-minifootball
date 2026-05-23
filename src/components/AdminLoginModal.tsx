import { useState } from 'react'
import { Lock, AlertCircle } from 'lucide-react'

interface AdminLoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  correctLogin: string
  correctPasswordHash: string
}

export function AdminLoginModal({
  isOpen,
  onClose,
  onSuccess,
  correctLogin,
  correctPasswordHash,
}: AdminLoginModalProps) {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Имитация задержки для реалистичности
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Вычисляем SHA-256 от введённого пароля и сравниваем с хэшем
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    if (login === correctLogin && hashHex === correctPasswordHash) {
      // Сохраняем админ статус в localStorage
      localStorage.setItem('adminSessionToken', 'authenticated')
      setLogin('')
      setPassword('')
      setIsLoading(false)
      onSuccess()
      onClose()
      // Перезагружаем страницу чтобы обновить состояние приложения
      setTimeout(() => {
        window.location.reload()
      }, 200)
    } else {
      setError('Неверный логин или пароль')
      setPassword('')
      setIsLoading(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-md animate-in fade-in scale-in-95 duration-300">
        {/* Карточка входа */}
        <div className="bg-gradient-to-br from-brand-bg via-brand-surface to-brand-bg border border-brand-accent/25 rounded-2xl p-8 shadow-2xl">
          {/* Заголовок */}
          <div className="mb-8 text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-12 h-12 rounded-full bg-brand-accent/20 flex items-center justify-center">
                <Lock className="w-6 h-6 text-brand-accent" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-wider">
              Вход администратора
            </h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.1em]">
              Введите учётные данные
            </p>
          </div>

          {/* Форма */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Поле логина */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-300 uppercase tracking-widest">
                Логин
              </label>
              <input
                type="text"
                value={login}
                onChange={(e) => {
                  setLogin(e.target.value)
                  setError('')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const passwordInput = document.querySelector(
                      'input[type="password"]'
                    ) as HTMLInputElement
                    if (passwordInput) {
                      passwordInput.focus()
                    }
                  }
                }}
                disabled={isLoading}
                placeholder="Введите логин"
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-accent/50 focus:bg-slate-800 transition-all disabled:opacity-50"
              />
            </div>

            {/* Поле пароля */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-300 uppercase tracking-widest">
                Пароль
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSubmit(e as any)
                  }
                }}
                disabled={isLoading}
                placeholder="Введите пароль"
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-accent/50 focus:bg-slate-800 transition-all disabled:opacity-50"
              />
            </div>

            {/* Сообщение об ошибке */}
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span className="text-xs font-bold text-red-400">{error}</span>
              </div>
            )}

            {/* Кнопка входа */}
            <button
              type="submit"
              disabled={isLoading || !login || !password}
              className="w-full bg-gradient-to-r from-brand-accent to-brand-accent-light hover:from-brand-accent-light hover:to-brand-accent disabled:from-slate-700 disabled:to-slate-700 text-white font-black uppercase tracking-wider py-3 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 mt-2"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Проверка...
                </span>
              ) : (
                'Войти'
              )}
            </button>
          </form>

          {/* Кнопка закрытия */}
          <button
            onClick={onClose}
            className="w-full mt-4 text-xs font-bold text-slate-400 hover:text-slate-300 uppercase tracking-widest py-2 transition-colors"
          >
            Отмена
          </button>

          {/* Декоративные элементы */}
          <div className="mt-6 pt-6 border-t border-slate-700/30 flex items-center justify-center">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              🔐 Только администраторы
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
