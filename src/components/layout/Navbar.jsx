import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ROUTES } from '../../routes/routes'
import { ROLES } from '../../utils/constants'
import { useAuthContext } from '../../context/AuthContext'

const NAV_LINKS = [
  { label: 'Beranda', href: '/' },
  { label: 'Profil Desa', to: ROUTES.VILLAGE_PROFILE },
  { label: 'Berita', to: ROUTES.NEWS },
  { label: 'Kontak', to: ROUTES.CONTACT },
]

const ROLE_HOME = {
  [ROLES.CITIZEN]: ROUTES.CITIZEN_DASHBOARD,
  [ROLES.ADMIN]:   ROUTES.ADMIN_DASHBOARD,
}

// ── Icons ────────────────────────────────────────────────────────────────────

function LogoIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="white" aria-hidden="true">
      <path d="M2 20V8.5L12 3l10 5.5V20h-5v-6H7v6H2z" />
      <path d="M9 20v-4h6v4" />
    </svg>
  )
}

function UserCircleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="1.75" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
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

// ── Sub-components ────────────────────────────────────────────────────────────

function NavLink({ link, isActive, onClick }) {
  const className = `text-sm no-underline transition-colors ${
    isActive
      ? 'font-medium text-[#1e40af]'
      : 'font-normal text-[rgba(26,26,26,0.6)] hover:text-[#1a1a1a]'
  }`

  if (link.to) {
    return (
      <Link to={link.to} className={className} onClick={onClick}>
        {link.label}
      </Link>
    )
  }

  return (
    <a href={link.href} className={className} onClick={onClick}>
      {link.label}
    </a>
  )
}

// ── Navbar ────────────────────────────────────────────────────────────────────

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location  = useLocation()
  const navigate  = useNavigate()
  const { user, role, logout } = useAuthContext()

  const dashboardRoute = ROLE_HOME[role] ?? ROUTES.CITIZEN_DASHBOARD

  function isActive(link) {
    if (link.to) return location.pathname === link.to
    return location.pathname === '/' && link.href === '/'
  }

  function handleLogout() {
    logout()
    setMobileOpen(false)
    navigate(ROUTES.HOME, { replace: true })
  }

  return (
    <header
      className="sticky top-0 z-50 border-b border-[#e5e7eb]"
      style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(8px)' }}
    >
      <div className="max-w-[1280px] mx-auto px-4 flex items-center justify-between h-16">

        {/* Logo — goes to dashboard if logged in, home otherwise */}
        <div className="flex items-center gap-8">
          <Link
            to={user ? dashboardRoute : ROUTES.HOME}
            className="flex items-center gap-2 no-underline"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #1e40af 0%, #10b981 100%)' }}
            >
              <LogoIcon />
            </div>
            <span className="font-semibold text-base text-[#1a1a1a] tracking-[-0.31px]">
              SADEWA
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.label} link={link} isActive={isActive(link)} />
            ))}
          </nav>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user ? (
            /* Logged-in: profile chip + logout */
            <>
              <Link
                to={dashboardRoute}
                className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-lg hover:bg-[#f3f4f6] transition-colors no-underline"
              >
                <UserCircleIcon />
                <span className="font-medium text-[14px] text-[#1a1a1a] tracking-[-0.15px] max-w-[140px] truncate">
                  {user.name}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="hidden sm:block h-9 px-3 bg-white border border-[#e5e7eb] rounded-lg text-sm font-medium text-[#1a1a1a] hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Keluar
              </button>
            </>
          ) : (
            /* Guest: login button */
            <Link to={ROUTES.LOGIN} className="hidden sm:block">
              <button className="h-9 px-[13px] bg-white border border-[#e5e7eb] rounded-lg text-sm font-medium text-[#1a1a1a] hover:bg-gray-50 transition-colors cursor-pointer">
                Masuk
              </button>
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-[#1a1a1a] p-1"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <CloseIcon /> : <HamburgerIcon />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <nav
          className="md:hidden border-t border-[#e5e7eb] bg-white"
          aria-label="Mobile navigation"
        >
          <div className="max-w-[1280px] mx-auto px-4 py-4 flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.label}
                link={link}
                isActive={isActive(link)}
                onClick={() => setMobileOpen(false)}
              />
            ))}
            {user ? (
              <>
                <Link
                  to={dashboardRoute}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 w-fit no-underline"
                >
                  <UserCircleIcon />
                  <span className="font-medium text-[14px] text-[#1a1a1a]">{user.name}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="h-9 px-4 bg-white border border-[#e5e7eb] rounded-lg text-sm font-medium text-[#1a1a1a] w-fit cursor-pointer"
                >
                  Keluar
                </button>
              </>
            ) : (
              <Link to={ROUTES.LOGIN} className="w-fit mt-1">
                <button className="h-9 px-4 bg-white border border-[#e5e7eb] rounded-lg text-sm font-medium text-[#1a1a1a] cursor-pointer">
                  Masuk
                </button>
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  )
}
