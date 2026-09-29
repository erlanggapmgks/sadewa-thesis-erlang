// Intro screen shown ONLY on:
//   1. First ever load of the app (fresh tab / direct URL open)
//   2. Hard refresh (F5 / Cmd+R / browser reload button)
//
// SPA navigations between routes NEVER trigger this screen.
//
// Detection strategy:
//   - Check performance.getEntriesByType('navigation')[0].type
//     'navigate' = fresh load from outside (first open)
//     'reload'   = browser refresh
//     'back_forward' / 'prerender' = skip splash
//   - Additionally guard with sessionStorage so the very first
//     'navigate' only shows once; subsequent 'navigate' entries
//     that come from SPA link clicks are filtered out because
//     SPA navigations don't produce a new navigation entry at all
//     (the JS module is never re-evaluated).

import { useEffect, useRef, useState } from 'react'

const LOGO_SRC    = '/sadewa-logo.png'
const SESSION_KEY = 'sadewa_splash_shown'

// Durations (ms)
const FADE_IN_DURATION  = 700
const HOLD_DURATION     = 1200
const FADE_OUT_DURATION = 500

/**
 * Returns true if the splash screen should be shown.
 * Called once at module load (App.jsx constant), so it runs exactly once
 * per page evaluation — which only happens on first open or refresh,
 * never on SPA route changes.
 */
export function shouldShowSplash() {
  try {
    const [entry] = performance.getEntriesByType('navigation')
    const navType = entry?.type // 'navigate' | 'reload' | 'back_forward' | 'prerender'

    if (navType === 'reload') {
      // Always show on refresh
      return true
    }

    if (navType === 'navigate') {
      // First open — show only once per session
      if (sessionStorage.getItem(SESSION_KEY)) return false
      sessionStorage.setItem(SESSION_KEY, '1')
      return true
    }

    // back_forward, prerender, or unknown — skip splash
    return false
  } catch {
    // Fallback for browsers without Navigation Timing API
    if (sessionStorage.getItem(SESSION_KEY)) return false
    sessionStorage.setItem(SESSION_KEY, '1')
    return true
  }
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
