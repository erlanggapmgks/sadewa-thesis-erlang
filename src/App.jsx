import { useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import SplashScreen, { shouldShowSplash } from './components/SplashScreen'

// Evaluated once at module load — before any re-renders.
// sessionStorage check happens here so it's synchronous and reliable.
const SHOW_SPLASH = shouldShowSplash()

export default function App() {
  const [splashDone, setSplashDone] = useState(!SHOW_SPLASH)

  return (
    <>
      {!splashDone && <SplashScreen onExited={() => setSplashDone(true)} />}
      <RouterProvider router={router} />
    </>
  )
}
