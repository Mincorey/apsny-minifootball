import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface Props {
  src: string
  name?: string
  onClose: () => void
}

export function PhotoModal({ src, name, onClose }: Props) {
  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Swipe-down to close
  const touchStartY = useRef<number>(0)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientY - touchStartY.current
    if (delta > 80) onClose()
  }

  return (
    <>
      <style>{`
        @keyframes photoFadeIn {
          from { opacity: 0 }
          to   { opacity: 1 }
        }
        @keyframes photoScaleIn {
          from { opacity: 0; transform: scale(0.72) }
          to   { opacity: 1; transform: scale(1) }
        }
        .photo-modal-overlay { animation: photoFadeIn 0.22s ease forwards; }
        .photo-modal-card    { animation: photoScaleIn 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards; }
      `}</style>

      {/* Backdrop */}
      <div
        className="photo-modal-overlay fixed inset-0 z-[200] flex flex-col items-center justify-center p-6"
        style={{
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          background: 'rgba(0,0,0,0.85)',
        }}
        onClick={onClose}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Close button */}
        <button
          onClick={e => { e.stopPropagation(); onClose() }}
          className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center
                     transition-all hover:bg-white/20 active:scale-90"
          style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}
        >
          <X size={20} />
        </button>

        {/* Photo + name */}
        <div
          className="photo-modal-card flex flex-col items-center gap-5"
          onClick={e => e.stopPropagation()}
        >
          <div
            className="rounded-full overflow-hidden flex-shrink-0"
            style={{
              width: 'min(72vw, 300px)',
              height: 'min(72vw, 300px)',
              boxShadow: '0 0 60px rgba(0,0,0,0.6), 0 0 0 4px rgba(255,255,255,0.12)',
            }}
          >
            <img src={src} alt={name ?? ''} className="w-full h-full object-cover" />
          </div>

          {name && (
            <p
              className="text-lg font-bold text-center"
              style={{ color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
            >
              {name}
            </p>
          )}

          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.38)' }}>
            Нажмите за пределами для закрытия
          </p>
        </div>
      </div>
    </>
  )
}
