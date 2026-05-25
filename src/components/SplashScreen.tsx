import { useEffect, useState } from 'react'

interface Props {
  onDone: () => void
}

export function SplashScreen({ onDone }: Props) {
  const [fading, setFading] = useState(false)

  useEffect(() => {
    // Start fade-out at 2.0s, fully gone at 2.7s
    const t1 = setTimeout(() => setFading(true), 2000)
    const t2 = setTimeout(() => onDone(), 2700)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])

  return (
    <>
      <style>{`
        @keyframes splashLogoIn {
          from { opacity: 0; transform: scale(0.78) translateY(12px) }
          to   { opacity: 1; transform: scale(1)   translateY(0) }
        }
        @keyframes splashPulse {
          0%, 100% { opacity: 0.4; transform: scale(1) }
          50%       { opacity: 0.7; transform: scale(1.08) }
        }
        @keyframes splashDotsIn {
          from { opacity: 0; transform: translateY(8px) }
          to   { opacity: 1; transform: translateY(0) }
        }
        @keyframes splashDot {
          0%, 80%, 100% { transform: scale(0); opacity: 0.3 }
          40%            { transform: scale(1); opacity: 1 }
        }
        .splash-logo {
          animation: splashLogoIn 0.75s cubic-bezier(0.34,1.56,0.64,1) 0.15s both;
        }
        .splash-glow {
          animation: splashPulse 2.4s ease-in-out infinite;
        }
        .splash-dots {
          animation: splashDotsIn 0.5s ease 0.8s both;
        }
        .splash-dot-1 { animation: splashDot 1.4s ease-in-out 0.9s infinite; }
        .splash-dot-2 { animation: splashDot 1.4s ease-in-out 1.1s infinite; }
        .splash-dot-3 { animation: splashDot 1.4s ease-in-out 1.3s infinite; }
      `}</style>

      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '32px',
          background: 'radial-gradient(ellipse 120% 80% at 50% 30%, #0d2116 0%, #0a150e 45%, #050c07 100%)',
          transition: 'opacity 0.7s ease',
          opacity: fading ? 0 : 1,
          pointerEvents: fading ? 'none' : 'all',
        }}
      >
        {/* Ambient glow ring */}
        <div
          className="splash-glow"
          style={{
            position: 'absolute',
            width: 'min(80vw, 360px)',
            height: 'min(80vw, 360px)',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,117,49,0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Logo */}
        <img
          src="/img/main-logo.png"
          alt="APSNY Mini-Football"
          className="splash-logo"
          style={{
            width: 'min(68vw, 280px)',
            position: 'relative',
            filter: 'drop-shadow(0 0 32px rgba(122,219,138,0.30)) drop-shadow(0 4px 24px rgba(0,0,0,0.6))',
          }}
        />

        {/* Loading dots */}
        <div className="splash-dots" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div className="splash-dot-1" style={{ width: 7, height: 7, borderRadius: '50%', background: '#7adb8a' }} />
          <div className="splash-dot-2" style={{ width: 7, height: 7, borderRadius: '50%', background: '#7adb8a' }} />
          <div className="splash-dot-3" style={{ width: 7, height: 7, borderRadius: '50%', background: '#7adb8a' }} />
        </div>
      </div>
    </>
  )
}
