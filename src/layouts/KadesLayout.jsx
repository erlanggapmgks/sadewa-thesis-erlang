import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import Footer from '../components/layout/Footer'
import { ROUTES } from '../routes/routes'
import { useAuthContext } from '../context/AuthContext'

const LOGO_GRADIENT = 'linear-gradient(135deg, #7c3aed 0%, #10b981 100%)'

function LogoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white" aria-hidden="true">
      <path d="M2 20V8.5L12 3l10 5.5V20h-5v-6H7v6H2z" />
      <path d="M9 20v-4h6v4" />
    </svg>
  )
}
function UserCircleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="1.75">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  )
}
function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="1.75">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
    </svg>
  )
}
function DashboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  )
}
function DocumentIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  )
}

const NAV_ITEMS = [
  { label: 'Dashboard',       Icon: DashboardIcon, to: ROUTES.KADES_DASHBOARD },
  { label: 'Daftar Pengajuan', Icon: DocumentIcon,  to: ROUTES.KADES_REQUESTS },
]

export default function KadesLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthContext()

  function handleLogout() {
    logout()
    navigate(ROUTES.LOGIN, { replace: true })
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f9fafb' }}>

      {/* Header */}
      <header
        className="border-b border-[#e5e7eb] sticky top-0 z-30 shrink-0"
        style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(8px)' }}
      >
        <div className="h-16 flex items-center justify-between px-6">
          <Link to={ROUTES.KADES_DASHBOARD} className="flex items-center gap-2 no-underline">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: LOGO_GRADIENT }}>
              <LogoIcon />
            </div>
            <span className="font-semibold text-[15px] text-[#1a1a1a] tracking-[-0.31px]">SADEWA</span>
            <span className="ml-1 px-2 py-0.5 rounded text-[11px] font-medium" style={{ background: 'rgba(124,58,237,0.1)', color: '#7c3aed' }}>
              Kepala Desa
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg">
              <UserCircleIcon />
              <span className="font-medium text-[14px] text-[#1a1a1a] tracking-[-0.15px]">{user?.name ?? 'Profil'}</span>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 h-9 px-3 rounded-lg hover:bg-[#f3f4f6] transition-colors cursor-pointer border-0 bg-transparent">
              <LogoutIcon />
              <span className="font-medium text-[14px] text-[#1a1a1a] tracking-[-0.15px]">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">

        {/* Sidebar */}
        <aside className="w-56 shrink-0 border-r border-[#e5e7eb] hidden md:flex flex-col bg-white">
          <nav className="flex flex-col gap-1 p-3 flex-1 pt-4">
            {NAV_ITEMS.map((item) => {
              const active = location.pathname === item.to
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className="flex items-center gap-3 h-9 px-3 rounded-lg text-[14px] font-medium transition-colors no-underline"
                  style={{
                    background: active ? 'rgba(124,58,237,0.08)' : 'transparent',
                    color: active ? '#7c3aed' : '#6b7280',
                  }}
                >
                  <item.Icon />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 flex flex-col overflow-auto">
          <div className="flex-1">
            <Outlet />
          </div>
          <Footer />
        </main>
      </div>
    </div>
  )
}
