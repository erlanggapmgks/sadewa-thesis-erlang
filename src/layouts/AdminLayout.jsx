import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import Footer from '../components/layout/Footer'
import { ROUTES } from '../routes/routes'
import { useAuthContext } from '../context/AuthContext'

const LOGO_GRADIENT = 'linear-gradient(135deg, #1e40af 0%, #10b981 100%)'

function LogoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white" aria-hidden="true">
      <path d="M2 20V8.5L12 3l10 5.5V20h-5v-6H7v6H2z" />
      <path d="M9 20v-4h6v4" />
    </svg>
  )
}
function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="1.75">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
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
function UsersGroupIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  )
}
function UsersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  )
}
function ReportIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z" />
    </svg>
  )
}
function CogIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  )
}

const NAV_ITEMS = [
  { label: 'Dashboard',        Icon: DashboardIcon,  to: ROUTES.ADMIN_DASHBOARD },
  { label: 'Kelola Pengajuan', Icon: DocumentIcon,   to: ROUTES.ADMIN_REQUESTS },
  { label: 'Data Warga',       Icon: UsersGroupIcon, to: ROUTES.ADMIN_CITIZENS },
  { label: 'Kelola Pengguna',  Icon: UsersIcon,      to: ROUTES.ADMIN_USERS },
  { label: 'Laporan',          Icon: ReportIcon,     to: ROUTES.ADMIN_REPORTS },
  { label: 'Pengaturan',       Icon: CogIcon,        to: ROUTES.ADMIN_SETTINGS },
]

export default function AdminLayout() {
  const navigate  = useNavigate()
  const location  = useLocation()
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
          <Link to={ROUTES.ADMIN_DASHBOARD} className="flex items-center gap-2 no-underline">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: LOGO_GRADIENT }}>
              <LogoIcon />
            </div>
            <span className="font-semibold text-[15px] text-[#1a1a1a] tracking-[-0.31px]">SADEWA</span>
            <span className="ml-1 px-2 py-0.5 rounded text-[11px] font-medium" style={{ background: 'rgba(30,64,175,0.1)', color: '#1e40af' }}>
              Admin
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-[#f3f4f6] transition-colors cursor-pointer border-0 bg-transparent" aria-label="Notifikasi">
              <BellIcon />
              <span className="absolute top-1.5 left-[22px] w-2 h-2 bg-red-500 rounded-full" />
            </button>
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
                    background: active ? 'rgba(30,64,175,0.08)' : 'transparent',
                    color: active ? '#1e40af' : '#6b7280',
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
