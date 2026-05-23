import { useState } from 'react'
import { X } from 'lucide-react'

export function TextInputDialog({
  isOpen,
  title,
  placeholder = '',
  defaultValue = '',
  onSubmit,
  onCancel,
}: {
  isOpen: boolean
  title: string
  placeholder?: string
  defaultValue?: string
  onSubmit: (value: string) => void
  onCancel: () => void
}) {
  const [value, setValue] = useState(defaultValue)

  if (!isOpen) return null

  const handleSubmit = () => {
    onSubmit(value)
    setValue('')
  }

  const handleCancel = () => {
    setValue('')
    onCancel()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full mx-4 border border-white/10 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={handleCancel} className="text-gray-400 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit()
            if (e.key === 'Escape') handleCancel()
          }}
          className="w-full px-3 py-2 bg-gray-800 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 mb-6"
        />

        <div className="flex gap-3 justify-end">
          <button
            onClick={handleCancel}
            className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium transition"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
