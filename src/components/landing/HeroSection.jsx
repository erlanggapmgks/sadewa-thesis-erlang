import { Link } from 'react-router-dom'
import { ROUTES } from '../../routes/routes'

function ShieldCheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.955 11.955 0 0 0 3 10c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
  )
}

export default function HeroSection() {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: 'linear-gradient(159.82deg, #1e40af 0%, rgba(30,64,175,0.9) 50%, #10b981 100%)',
        minHeight: '492px',
      }}
      id="beranda"
      aria-label="Hero section"
    >
      {/* Subtle white overlay for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 60%)' }}
        aria-hidden="true"
      />

      {/* Main content — pb-28 gives room for the stats bar to overlap */}
      <div className="relative max-w-[1280px] mx-auto px-4 pt-20 pb-28 md:pb-32">
        <div className="max-w-[768px]">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-4"
            style={{ background: 'rgba(255,255,255,0.1)' }}>
            <ShieldCheckIcon />
            <span className="text-white text-sm leading-5">Layanan Pemerintah Terpercaya</span>
          </div>

          {/* Heading */}
          <h1
            className="text-white font-medium leading-[1.2] mt-2 mb-6 whitespace-pre-line"
            style={{ fontSize: 'clamp(36px, 5vw, 60px)', letterSpacing: '0.26px' }}
          >
            Sistem Administrasi{'\n'}Desa Wates
          </h1>

          {/* Description */}
          <p
            className="font-normal leading-7 mb-8 max-w-[600px]"
            style={{ fontSize: '20px', color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.45px' }}
          >
            Ajukan dan pantau dokumen administrasi desa secara online, kapan saja dan di mana saja.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-wrap gap-4">
            <Link to={ROUTES.LOGIN}>
              <button className="inline-flex items-center gap-2 bg-white text-[#1e40af] font-medium text-base px-6 rounded-lg h-11 hover:bg-blue-50 transition-colors cursor-pointer">
                Mulai Sekarang
                <ArrowRightIcon />
              </button>
            </Link>
            <a href="#layanan">
              <button
                className="inline-flex items-center bg-white border border-white text-[#0a0a0a] font-medium text-base px-6 rounded-lg h-11 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Lihat Layanan
              </button>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
