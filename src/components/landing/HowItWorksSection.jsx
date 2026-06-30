const STEPS = [
  {
    number: '01',
    title: 'Daftar & Masuk',
    description: 'Buat akun dengan email dan NIK Anda, lalu masuk ke portal SADEWA.',
    color: '#1e40af',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Pilih Layanan & Unggah Dokumen',
    description: 'Pilih jenis surat yang dibutuhkan, lalu foto dan unggah KTP serta KK Anda.',
    color: '#7c3aed',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'AI Membaca & Memverifikasi',
    description: 'Sistem AI membaca dokumen secara otomatis, memeriksa kualitas, dan mengisi formulir permohonan.',
    color: '#059669',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
      </svg>
    ),
  },
  {
    number: '04',
    title: 'Surat Diterbitkan',
    description: 'Petugas meninjau hasil AI dan menyetujui permohonan. Surat resmi siap dicetak.',
    color: '#10b981',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    ),
  },
]

function ArrowIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.75" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
  )
}

export default function HowItWorksSection() {
  return (
    <section className="py-20" style={{ background: '#f9fafb' }} id="cara-kerja" aria-label="Cara kerja sistem">
      <div className="max-w-[1280px] mx-auto px-4">

        {/* Header */}
        <div className="text-center mb-14">
          <span
            className="inline-block px-3 py-1 rounded-full text-[13px] font-medium mb-4"
            style={{ background: 'rgba(30,64,175,0.08)', color: '#1e40af' }}
          >
            Proses Mudah & Cepat
          </span>
          <h2 className="font-medium text-[36px] text-[#1a1a1a] leading-10 tracking-[0.37px]">
            Cara Kerja SADEWA
          </h2>
          <p className="mt-4 text-[18px] text-[#6b7280] leading-7 max-w-[560px] mx-auto">
            Empat langkah sederhana untuk mendapatkan dokumen administrasi desa secara online
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          {STEPS.map((step, i) => (
            <div key={step.number} className="flex flex-col items-center text-center relative">
              {/* Connector arrow — hidden on last item and on mobile */}
              {i < STEPS.length - 1 && (
                <div className="hidden lg:flex absolute top-[28px] left-[calc(50%+44px)] right-0 justify-center items-center pointer-events-none"
                  style={{ width: 'calc(100% - 56px)', left: 'calc(50% + 44px)' }}>
                  <ArrowIcon />
                </div>
              )}

              {/* Icon circle */}
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-4 shrink-0"
                style={{ background: step.color, boxShadow: `0 4px 16px ${step.color}40` }}
              >
                {step.icon}
              </div>

              {/* Step number */}
              <span className="text-[12px] font-bold tracking-widest mb-2" style={{ color: step.color }}>
                LANGKAH {step.number}
              </span>

              {/* Title */}
              <h3 className="font-semibold text-[16px] text-[#1a1a1a] leading-6 mb-2">
                {step.title}
              </h3>

              {/* Description */}
              <p className="text-[14px] text-[#6b7280] leading-6 max-w-[220px]">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
