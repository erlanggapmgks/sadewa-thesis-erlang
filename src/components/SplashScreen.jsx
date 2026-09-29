// Intro screen shown on first load AND every browser refresh.
// Logic:
//   - On module load, check sessionStorage for the key.
//   - If absent → show splash, set the key.
//   - Register a `beforeunload` listener to DELETE the key so the next
//     page load (refresh / new tab / close+reopen) shows splash again.
//   - SPA navigations never trigger `beforeunload`, so the key stays and
//     splash is NOT shown when navigating between routes.

import { useEffect, useRef, useState } from 'react'

const LOGO_SRC    = '/sadewa-logo.png'
const SESSION_KEY = 'sadewa_splash_shown'

// Durations (ms)
const FADE_IN_DURATION  = 700
const HOLD_DURATION     = 1200
const FADE_OUT_DURATION = 500

/**
 * Call once at module load.
 * Returns true if splash should show, and registers a beforeunload handler
 * that clears the key so refreshes always show splash again.
 */
export function shouldShowSplash() {
  // Register beforeunload so refresh/close always clears the flag
  window.addEventListener('beforeunload', () => {
    sessionStorage.removeItem(SESSION_KEY)
  })

  if (sessionStorage.getItem(SESSION_KEY)) return false
  sessionStorage.setItem(SESSION_KEY, '1')
  return true
}

export default function SplashScreen({ onExited }) {
  const [phase, setPhase] = useState('enter') // 'enter' | 'hold' | 'exit' | 'done'
  const timerRef = useRef(null)

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setPhase('hold')
      timerRef.current = setTimeout(() => {
        setPhase('exit')
        timerRef.current = setTimeout(() => {
          setPhase('done')
          onExited?.()
        }, FADE_OUT_DURATION)
      }, HOLD_DURATION)
    }, FADE_IN_DURATION)

    return () => clearTimeout(timerRef.current)
  }, [onExited])

  if (phase === 'done') return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        animation: phase === 'exit'
          ? `fade-out ${FADE_OUT_DURATION}ms ease forwards`
          : 'none',
      }}
      aria-live="polite"
      aria-label="Memuat SADEWA..."
    >
      {/*
        Responsive logo size:
          mobile  (< 640px)  : 200px
          tablet  (640–1023px): 280px
          desktop (≥ 1024px) : 400px
        Implemented via a CSS custom property set by a <style> block so we
        can use plain inline styles without Tailwind (avoids JIT purge issues
        for dynamic values).
      */}
      <style>{`
        .splash-logo {
          width: 200px;
          height: 200px;
          object-fit: contain;
          animation: fade-up ${FADE_IN_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @media (min-width: 640px) {
          .splash-logo { width: 280px; height: 280px; }
        }
        @media (min-width: 1024px) {
          .splash-logo { width: 400px; height: 400px; }
        }
      `}</style>

      <img
        src={LOGO_SRC}
        alt="Logo SADEWA"
        className="splash-logo"
      />
    </div>
  )
}
