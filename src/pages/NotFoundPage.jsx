import { Link, useNavigate } from 'react-router-dom'
import { ROUTES } from '../routes/routes'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center text-center px-6"
      style={{ background: '#f9fafb' }}
    >
      {/* Decorative circle */}
      <div
        className="w-32 h-32 rounded-full flex items-center justify-center mb-8"
        style={{ background: 'linear-gradient(135deg, rgba(30,64,175,0.08) 0%, rgba(16,185,129,0.08) 100%)' }}
      >
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#1e40af" strokeWidth="1.25">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
        </svg>
      </div>

      {/* Number */}
      <p
        className="font-bold leading-none mb-4"
        style={{
          fontSize: 'clamp(80px, 15vw, 120px)',
          background: 'linear-gradient(135deg, #1e40af, #10b981)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        404
      </p>

      <h1 className="font-semibold text-[24px] text-[#1a1a1a] mb-3">Halaman Tidak Ditemukan</h1>
      <p className="text-[16px] text-[#6b7280] leading-6 max-w-sm mb-10">
        Halaman yang Anda cari tidak ada atau telah dipindahkan. Periksa kembali URL atau kembali ke beranda.
      </p>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={() => navigate(-1)}
          className="h-11 px-6 rounded-lg border border-[#e5e7eb] bg-white text-[14px] font-medium text-[#6b7280] hover:bg-[#f3f4f6] transition-colors cursor-pointer"
        >
          ← Kembali
        </button>
        <Link to={ROUTES.HOME}>
          <button
            className="h-11 px-6 rounded-lg text-[14px] font-medium text-white cursor-pointer border-0 hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(90deg, #1e40af, #10b981)' }}
          >
            Ke Beranda
          </button>
        </Link>
        <Link to={ROUTES.LOGIN}>
          <button className="h-11 px-6 rounded-lg border border-[#e5e7eb] bg-white text-[14px] font-medium text-[#1e40af] hover:bg-[#eff6ff] transition-colors cursor-pointer">
            Masuk
          </button>
        </Link>
      </div>

      {/* Footer note */}
      <p className="mt-12 text-[13px] text-[#9ca3af]">
        SADEWA · Sistem Administrasi Desa Wates, Kab. Nganjuk
      </p>
    </div>
  )
}
