import { createContext, useContext, ReactNode, useState, useCallback } from 'react'
import { ConfirmDialog } from './ConfirmDialog'
import { TextInputDialog } from './TextInputDialog'
import { ToastContainer } from './ToastContainer'
import { useToast } from './Toast'
import type { ToastType } from './Toast'

interface DialogsContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void
  showConfirm: (options: {
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    isDangerous?: boolean
    onConfirm: () => void
    onCancel?: () => void
  }) => void
  showInput: (options: {
    title: string
    placeholder?: string
    defaultValue?: string
    onSubmit: (value: string) => void
    onCancel?: () => void
  }) => void
}

const DialogsContext = createContext<DialogsContextType | null>(null)

export function DialogsProvider({ children }: { children: ReactNode }) {
  const { toasts, show, remove } = useToast()
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean
    title: string
    message: string
    confirmText: string
    cancelText: string
    isDangerous: boolean
    onConfirm: () => void
    onCancel: () => void
  } | null>(null)

  const [inputState, setInputState] = useState<{
    isOpen: boolean
    title: string
    placeholder: string
    defaultValue: string
    onSubmit: (value: string) => void
    onCancel: () => void
  } | null>(null)

  const showConfirm = useCallback((options: Parameters<DialogsContextType['showConfirm']>[0]) => {
    setConfirmState({
      isOpen: true,
      title: options.title,
      message: options.message,
      confirmText: options.confirmText || 'Подтвердить',
      cancelText: options.cancelText || 'Отмена',
      isDangerous: options.isDangerous || false,
      onConfirm: () => {
        options.onConfirm()
        setConfirmState(null)
      },
      onCancel: () => {
        options.onCancel?.()
        setConfirmState(null)
      },
    })
  }, [])

  const showInput = useCallback((options: Parameters<DialogsContextType['showInput']>[0]) => {
    setInputState({
      isOpen: true,
      title: options.title,
      placeholder: options.placeholder || '',
      defaultValue: options.defaultValue || '',
      onSubmit: (value) => {
        options.onSubmit(value)
        setInputState(null)
      },
      onCancel: () => {
        options.onCancel?.()
        setInputState(null)
      },
    })
  }, [])

  return (
    <DialogsContext.Provider value={{ showToast: show, showConfirm, showInput }}>
      {children}
      {confirmState && (
        <ConfirmDialog
          isOpen={confirmState.isOpen}
          title={confirmState.title}
          message={confirmState.message}
          confirmText={confirmState.confirmText}
          cancelText={confirmState.cancelText}
          isDangerous={confirmState.isDangerous}
          onConfirm={confirmState.onConfirm}
          onCancel={confirmState.onCancel}
        />
      )}
      {inputState && (
        <TextInputDialog
          isOpen={inputState.isOpen}
          title={inputState.title}
          placeholder={inputState.placeholder}
          defaultValue={inputState.defaultValue}
          onSubmit={inputState.onSubmit}
          onCancel={inputState.onCancel}
        />
      )}
      <ToastContainer toasts={toasts} onRemove={remove} />
    </DialogsContext.Provider>
  )
}

export function useDialogs() {
  const context = useContext(DialogsContext)
  if (!context) {
    throw new Error('useDialogs must be used within DialogsProvider')
  }
  return context
}
