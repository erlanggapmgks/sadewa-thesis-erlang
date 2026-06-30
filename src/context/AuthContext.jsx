import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import * as authService from '../services/authService'
import { ROUTES } from '../routes/routes'

const AuthContext = createContext(null)

// ── Demo fallback (used when Supabase env vars are not configured) ─────────────

const DEMO_USERS = {
  'warga@demo.id': { id: 'demo-citizen', name: 'Daniel Abraham', role: 'citizen', home: ROUTES.CITIZEN_DASHBOARD },
  'admin@demo.id': { id: 'demo-admin',   name: 'Admin Desa',     role: 'admin',   home: ROUTES.ADMIN_DASHBOARD },
}
const DEMO_PASSWORD = 'demo1234'
const SESSION_KEY = 'sadewa_demo_session'

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [role, setRole]       = useState(null)
  const [loading, setLoading] = useState(true)

  // ── Real Supabase session ────────────────────────────────────────────────────

  async function applySession(authUser) {
    setLoading(true)
    if (!authUser) {
      setUser(null)
      setRole(null)
      setLoading(false)
      return
    }
    const profile = await authService.getProfile(authUser.id)
    if (profile) {
      setUser({ id: profile.id, name: profile.full_name, email: profile.email, nik: profile.nik })
      setRole(profile.role)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!supabase) {
      // Restore demo session from sessionStorage
      const saved = sessionStorage.getItem(SESSION_KEY)
      if (saved) {
        try {
          const { user: u, role: r } = JSON.parse(saved)
          setUser(u)
          setRole(r)
        } catch (_) {}
      }
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      applySession(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // ── Auth actions ─────────────────────────────────────────────────────────────

  async function login(email, password) {
    // Demo accounts are intercepted before any network call
    const demo = DEMO_USERS[email]
    if (demo && password === DEMO_PASSWORD) {
      const userData = { id: demo.id, name: demo.name, email, nik: null }
      setUser(userData)
      setRole(demo.role)
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ user: userData, role: demo.role }))
      return { ok: true, home: demo.home }
    }

    if (!supabase) {
      return { ok: false, message: 'Email atau kata sandi salah.' }
    }

    // Sign in via Supabase then apply the session directly so AuthContext
    // state is set BEFORE the caller navigates — avoids ProtectedRoute
    // seeing user=null and bouncing back to /login.
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      const msg = error.message
      if (msg.includes('Invalid login credentials')) return { ok: false, message: 'Email atau kata sandi salah.' }
      if (msg.includes('Email not confirmed'))       return { ok: false, message: 'Email belum dikonfirmasi. Periksa inbox Anda.' }
      if (msg.includes('Password should be'))        return { ok: false, message: 'Kata sandi minimal 8 karakter.' }
      return { ok: false, message: msg }
    }

    await applySession(data.user)

    // React state isn't readable synchronously after applySession — re-read
    // role from the profile directly to determine where to navigate.
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
    const resolvedHome = profile?.role === 'admin' ? ROUTES.ADMIN_DASHBOARD : ROUTES.CITIZEN_DASHBOARD
    return { ok: true, home: resolvedHome }
  }

  async function register(email, password, fullName, nik) {
    if (!supabase) {
      return { ok: false, message: 'Pendaftaran tidak tersedia dalam mode demo. Hubungkan Supabase terlebih dahulu.' }
    }
    return authService.register(email, password, fullName, nik)
  }

  async function logout() {
    if (!supabase) {
      sessionStorage.removeItem(SESSION_KEY)
    } else {
      await authService.logout()
    }
    setUser(null)
    setRole(null)
  }

  function syncProfile(updates) {
    setUser(prev => ({ ...prev, ...updates }))
  }

  const value = { user, role, loading, login, register, logout, syncProfile }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuthContext must be used inside <AuthProvider>')
  return context
}
