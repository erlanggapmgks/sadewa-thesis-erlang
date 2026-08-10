import { Outlet, Link } from 'react-router-dom'
import Footer from '../components/layout/Footer'
import { ROUTES } from '../routes/routes'

const BG_COLOR = '#ffffff'
const LOGO_BG = '#1e5fb8'

// ── Icons ────────────────────────────────────────────────────────────────────

const SADEWA_LOGO_SRC = '/sadewa-logo.png'

function LogoIcon({ size = 64 }) {
  return (
    <img
      src={SADEWA_LOGO_SRC}
      alt="Logo SADEWA"
      width={size}
      height={size}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        objectFit: 'contain',
        display: 'block',
      }}
    />
  )
}

function DocumentCheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e5fb8" strokeWidth="1.75" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a372" strokeWidth="1.75" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.75" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

// ── Feature list ─────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: <DocumentCheckIcon />,
    bg: 'rgba(30,95,184,0.1)',
    title: 'Pengajuan Online',
    desc: 'Ajukan dokumen administrasi tanpa perlu datang ke kantor desa',
  },
  {
    icon: <ShieldIcon />,
    bg: 'rgba(22,163,114,0.1)',
    title: 'Aman & Transparan',
    desc: 'Pelacakan real-time dan verifikasi QR',
  },
  {
    icon: <ClockIcon />,
    bg: 'rgba(59,130,246,0.1)',
    title: 'Proses Cepat',
    desc: 'Pantau status permohonan Anda kapan saja',
  },
]

// ── Layout ───────────────────────────────────────────────────────────────────

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col">

      <main className="flex-1 flex items-center justify-center px-3 sm:px-4 py-8 sm:py-16" style={{ background: BG_COLOR }}>
        <div className="w-full max-w-[1152px] flex flex-col lg:flex-row items-center lg:items-start gap-6 sm:gap-8">

          {/* Left — branding + features */}
          <div className="hidden lg:flex flex-col w-[560px] shrink-0">

            {/* Logo only — centered */}
            <Link to={ROUTES.HOME} className="flex items-center justify-center w-full no-underline">
              <LogoIcon size={320} />
            </Link>

            {/* Features */}
            <div className="mt-14 flex flex-col gap-4">
              {FEATURES.map((f) => (
                <div key={f.title} className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: f.bg }}
                  >
                    {f.icon}
                  </div>
                  <div>
                    <p className="font-medium text-[18px] text-[#1a1a1a] leading-[27px] tracking-[-0.44px]">
                      {f.title}
                    </p>
                    <p className="mt-1 text-[14px] text-[#6b7280] leading-5 tracking-[-0.15px]">
                      {f.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Right — form (LoginPage / RegisterPage) */}
          <div className="w-full lg:flex-1 flex justify-center items-center lg:justify-end">
            {/* Mobile: show compact logo above form for brand identity */}
            <div className="w-full lg:w-auto flex flex-col items-center gap-6">
              <div className="lg:hidden">
                <Link to={ROUTES.HOME} className="no-underline">
                  <LogoIcon size={120} />
                </Link>
              </div>
              <Outlet />
            </div>
          </div>

        </div>
      </main>

      <Footer />

    </div>
  )
}
