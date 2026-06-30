import { Link } from 'react-router-dom'
import { ROUTES } from '../../routes/routes'
import { useAuthContext } from '../../context/AuthContext'

function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
  )
}

const SERVICES = [
  {
    key: 'domisili',
    title: 'Surat Keterangan Domisili',
    description: 'Bukti tempat tinggal resmi untuk keperluan kerja, membuka rekening, pendaftaran sekolah, dan lainnya.',
    days: '2–3 hari',
    color: '#1e40af',
    bg: 'rgba(30,64,175,0.06)',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1e40af" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12 11.204 3.045c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    key: 'pengantar',
    title: 'Surat Pengantar',
    description: 'Pengantar resmi dari desa untuk keperluan ke instansi lain, seperti SKCK, pernikahan, atau izin keramaian.',
    days: '1–2 hari',
    color: '#7c3aed',
    bg: 'rgba(124,58,237,0.06)',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
      </svg>
    ),
  },
  {
    key: 'sktm',
    title: 'Surat Keterangan Tidak Mampu',
    description: 'Untuk pengajuan beasiswa, keringanan biaya pengobatan, dan bantuan sosial dari pemerintah.',
    days: '2–3 hari',
    color: '#059669',
    bg: 'rgba(5,150,105,0.06)',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
      </svg>
    ),
  },
  {
    key: 'usaha',
    title: 'Surat Keterangan Usaha',
    description: 'Legalitas usaha mikro dan kecil untuk pengajuan KUR, perizinan, dan kebutuhan bisnis lainnya.',
    days: '3–5 hari',
    color: '#d97706',
    bg: 'rgba(217,119,6,0.06)',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016 2.993 2.993 0 0 0 2.25-1.016 3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
      </svg>
    ),
  },
  {
    key: 'kelahiran',
    title: 'Surat Keterangan Kelahiran',
    description: 'Keterangan resmi kelahiran untuk pendaftaran akta kelahiran di Dinas Kependudukan dan Catatan Sipil.',
    days: '1–2 hari',
    color: '#0891b2',
    bg: 'rgba(8,145,178,0.06)',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
  {
    key: 'kematian',
    title: 'Surat Keterangan Kematian',
    description: 'Keterangan resmi kematian untuk keperluan administrasi ahli waris dan pengurusan legalitas kepergian.',
    days: '1–2 hari',
    color: '#6b7280',
    bg: 'rgba(107,114,128,0.06)',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    ),
  },
]

function ServiceCard({ title, description, days, color, bg, icon }) {
  const { user } = useAuthContext()
  return (
    <article
      className="bg-white border border-[#e5e7eb] rounded-xl p-6 flex flex-col gap-4"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
    >
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[15px] text-[#1a1a1a] leading-5 mb-1">{title}</h3>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: bg, color }}>
            ± {days} kerja
          </span>
        </div>
      </div>
      <p className="text-[13px] text-[#6b7280] leading-5 flex-1">{description}</p>
      <Link
        to={user ? ROUTES.CITIZEN_REQUEST : ROUTES.LOGIN}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium no-underline hover:gap-2 transition-all"
        style={{ color }}
      >
        Ajukan Sekarang <ArrowRightIcon />
      </Link>
    </article>
  )
}

export default function ServicesSection() {
  return (
    <section className="py-20" style={{ background: '#f9fafb' }} id="layanan" aria-label="Layanan administrasi">
      <div className="max-w-[1280px] mx-auto px-4">

        {/* Section header */}
        <div className="text-center mb-12">
          <span
            className="inline-block px-3 py-1 rounded-full text-[13px] font-medium mb-4"
            style={{ background: 'rgba(245,158,11,0.1)', color: '#d97706' }}
          >
            6 Jenis Layanan
          </span>
          <h2 className="font-medium text-[36px] text-[#1a1a1a] leading-10 tracking-[0.37px]">
            Layanan Administrasi Desa
          </h2>
          <p className="mt-4 text-[18px] text-[#6b7280] leading-7 max-w-[600px] mx-auto">
            Ajukan berbagai dokumen administrasi secara online dengan proses yang cepat dan terverifikasi AI
          </p>
        </div>

        {/* 3×2 grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SERVICES.map(({ key, ...rest }) => (
            <ServiceCard key={key} {...rest} />
          ))}
        </div>
      </div>
    </section>
  )
}
