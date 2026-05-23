import { Toast, type ToastType } from './Toast'

export function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Array<{ id: string; message: string; type: ToastType; duration: number }>
  onRemove: (id: string) => void
}) {
  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast message={toast.message} type={toast.type} onClose={() => onRemove(toast.id)} />
        </div>
      ))}
    </div>
  )
}
