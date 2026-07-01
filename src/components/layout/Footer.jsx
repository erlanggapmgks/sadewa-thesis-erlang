import { Link } from 'react-router-dom'
import { ROUTES } from '../../routes/routes'

// ── Icons ────────────────────────────────────────────────────────────────────

function LogoIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="white" aria-hidden="true">
      <path d="M2 20V8.5L12 3l10 5.5V20h-5v-6H7v6H2z" />
      <path d="M9 20v-4h6v4" />
    </svg>
  )
}

function MapPinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.75" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.75" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
    </svg>
  )
}

function EnvelopeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.75" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#1e40af" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function TwitterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#1e40af" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#1e40af" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  )
}

// ── Data ─────────────────────────────────────────────────────────────────────

const QUICK_LINKS = ['Beranda', 'Profil Desa', 'Berita', 'Kontak']
const SERVICE_LINKS = ['Portal Warga', 'Permohonan Baru', 'Lacak Permohonan', 'Verifikasi QR']

const CONTACT_ITEMS = [
  { icon: <MapPinIcon />, text: 'Desa Wates, Kec. Tanjunganom, Kab. Nganjuk, Jawa Timur' },
  { icon: <PhoneIcon />,   text: '(0358) 321000' },
  { icon: <EnvelopeIcon />, text: 'deswates@nganjukkab.go.id' },
]

const SOCIALS = [
  { icon: <FacebookIcon />, label: 'Facebook' },
  { icon: <TwitterIcon />, label: 'Twitter' },
  { icon: <InstagramIcon />, label: 'Instagram' },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function Footer() {
  return (
    <footer
      className="border-t border-[#e5e7eb]"
      style={{ background: 'rgba(243,244,246,0.3)' }}
      id="kontak"
      aria-label="Footer"
    >
      <div className="max-w-[1280px] mx-auto px-4 py-12">

        {/* 4-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Col 1: Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg, #1e40af 0%, #10b981 100%)' }}
              >
                <LogoIcon />
              </div>
              <span className="font-semibold text-base text-[#1a1a1a] tracking-[-0.31px]">SADEWA</span>
            </div>
            <p className="text-sm text-[#6b7280] leading-5 max-w-[288px]">
              Platform layanan administrasi modern untuk tata kelola desa yang efisien dan pelayanan warga yang lebih baik.
            </p>
          </div>

          {/* Col 2: Tautan Cepat */}
          <nav aria-label="Tautan cepat">
            <h4 className="font-medium text-base text-[#1a1a1a] tracking-[-0.31px] mb-4">
              Tautan Cepat
            </h4>
            <ul className="flex flex-col gap-2 list-none p-0 m-0">
              {QUICK_LINKS.map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-[#6b7280] no-underline hover:text-[#1a1a1a] transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Col 3: Layanan */}
          <nav aria-label="Layanan">
            <h4 className="font-medium text-base text-[#1a1a1a] tracking-[-0.31px] mb-4">
              Layanan
            </h4>
            <ul className="flex flex-col gap-2 list-none p-0 m-0">
              {SERVICE_LINKS.map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-[#6b7280] no-underline hover:text-[#1a1a1a] transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Col 4: Informasi Kontak */}
          <div>
            <h4 className="font-medium text-base text-[#1a1a1a] tracking-[-0.31px] mb-4">
              Informasi Kontak
            </h4>
            <ul className="flex flex-col gap-3 list-none p-0 m-0">
              {CONTACT_ITEMS.map((item) => (
                <li key={item.text} className="flex items-center gap-2">
                  {item.icon}
                  <span className="text-sm text-[#6b7280]">{item.text}</span>
                </li>
              ))}
            </ul>

            {/* Social icons */}
            <div className="flex items-center gap-3 mt-4">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="w-8 h-8 rounded-lg flex items-center justify-center no-underline hover:opacity-80 transition-opacity"
                  style={{ background: 'rgba(30,64,175,0.1)' }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Divider + copyright */}
        <div className="border-t border-[#e5e7eb] mt-8 pt-8">
          <p className="text-sm text-[#6b7280] text-center">
            © 2026 SADEWA — Sistem Administrasi Desa Wates. Hak cipta dilindungi.
          </p>
        </div>
      </div>
    </footer>
  )
}
