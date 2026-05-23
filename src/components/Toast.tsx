import { useState } from 'react'
import { generateUUID } from '../lib/uuid'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export function Toast({ message, type = 'info', onClose }: { message: string; type?: ToastType; duration?: number; onClose?: () => void }) {
  const bgColor = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
    warning: 'bg-orange-600',
  }[type]

  return (
    <div className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-lg text-sm`}>
      {message}
    </div>
  )
}

export function useToast() {
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: ToastType; duration: number }>>([])

  const show = (message: string, type: ToastType = 'info', duration = 3000) => {
    const id = generateUUID()
    setToasts(prev => [...prev, { id, message, type, duration }])

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, duration)
    }
  }

  const remove = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return { toasts, show, remove }
}
