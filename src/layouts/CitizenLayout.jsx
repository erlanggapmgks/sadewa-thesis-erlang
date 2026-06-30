import { useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import Footer from '../components/layout/Footer'
import ChatAssistant from '../components/citizen/ChatAssistant'
import { ROUTES } from '../routes/routes'
import { useAuthContext } from '../context/AuthContext'

const LOGO_GRADIENT = 'linear-gradient(135deg, #1e40af 0%, #10b981 100%)'

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    to: ROUTES.CITIZEN_DASHBOARD,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
  },
  {
    label: 'Permohonan Baru',
    to: ROUTES.CITIZEN_REQUEST,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
  {
    label: 'Lacak Permohonan',
    to: ROUTES.CITIZEN_TRACK,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
    ),
  },
]

// ── Icons ────────────────────────────────────────────────────────────────────

function LogoIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="white" aria-hidden="true">
      <path d="M2 20V8.5L12 3l10 5.5V20h-5v-6H7v6H2z" />
      <path d="M9 20v-4h6v4" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="1.75" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.75" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
    </svg>
  )
}

function HamburgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

// ── Layout ───────────────────────────────────────────────────────────────────

export default function CitizenLayout() {
  const navigate   = useNavigate()
  const location   = useLocation()
  const { user, logout } = useAuthContext()
  const [menuOpen, setMenuOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate(ROUTES.LOGIN, { replace: true })
  }

  function initials(name) {
    return (name ?? 'W').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f9fafb' }}>

      {/* Header */}
      <header
        className="border-b border-[#e5e7eb] sticky top-0 z-30"
        style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)' }}
      >
        <div className="max-w-[1280px] mx-auto px-4 h-16 flex items-center justify-between gap-4">

          {/* Left: Logo + nav */}
          <div className="flex items-center gap-6 min-w-0">
            <Link to={ROUTES.CITIZEN_DASHBOARD} className="flex items-center gap-2 no-underline shrink-0">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: LOGO_GRADIENT }}>
                <LogoIcon />
              </div>
              <span className="font-semibold text-[15px] text-[#1a1a1a] tracking-[-0.3px]">SADEWA</span>
            </Link>

            {/* Desktop nav links */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Navigasi warga">
              {NAV_ITEMS.map(item => {
                const active = location.pathname === item.to
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] font-medium transition-colors no-underline"
                    style={{
                      background: active ? 'rgba(30,64,175,0.08)' : 'transparent',
                      color:      active ? '#1e40af' : '#6b7280',
                    }}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Right: avatar + bell + logout */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Bell */}
            <button
              className="relative p-2 rounded-lg hover:bg-[#f3f4f6] transition-colors cursor-pointer border-0 bg-transparent hidden sm:flex"
              aria-label="Notifikasi"
            >
              <BellIcon />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </button>

            {/* Profile chip */}
            <Link
              to={ROUTES.CITIZEN_PROFILE}
              className="hidden sm:flex items-center gap-2 h-9 px-2.5 rounded-lg hover:bg-[#f3f4f6] transition-colors no-underline"
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                style={{ background: LOGO_GRADIENT }}
              >
                {initials(user?.name)}
              </div>
              <span className="font-medium text-[13px] text-[#1a1a1a] max-w-[120px] truncate">
                {user?.name ?? 'Profil'}
              </span>
            </Link>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-lg hover:bg-[#f3f4f6] transition-colors cursor-pointer border-0 bg-transparent text-[13px] font-medium text-[#6b7280]"
            >
              <LogoutIcon />
              Keluar
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="md:hidden p-2 rounded-lg hover:bg-[#f3f4f6] transition-colors cursor-pointer border-0 bg-transparent"
              aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
            >
              {menuOpen ? <CloseIcon /> : <HamburgerIcon />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <nav
            className="md:hidden border-t border-[#e5e7eb] bg-white"
            aria-label="Navigasi mobile"
          >
            <div className="max-w-[1280px] mx-auto px-4 py-3 flex flex-col gap-1">
              {NAV_ITEMS.map(item => {
                const active = location.pathname === item.to
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 h-10 px-3 rounded-lg text-[14px] font-medium transition-colors no-underline"
                    style={{
                      background: active ? 'rgba(30,64,175,0.08)' : 'transparent',
                      color:      active ? '#1e40af' : '#374151',
                    }}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                )
              })}
              <div className="border-t border-[#f3f4f6] mt-2 pt-2 flex items-center justify-between">
                <Link
                  to={ROUTES.CITIZEN_PROFILE}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 no-underline"
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                    style={{ background: LOGO_GRADIENT }}>
                    {initials(user?.name)}
                  </div>
                  <span className="font-medium text-[13px] text-[#1a1a1a]">{user?.name ?? 'Profil'}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] font-medium text-[#6b7280] cursor-pointer border border-[#e5e7eb] bg-white hover:bg-[#f3f4f6] transition-colors"
                >
                  Keluar
                </button>
              </div>
            </div>
          </nav>
        )}
      </header>

      {/* Page content */}
      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />

      {/* AI Chat Assistant */}
      <ChatAssistant />
    </div>
  )
}
