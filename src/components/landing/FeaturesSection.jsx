const FEATURES = [
  {
    title: 'OCR Dokumen Otomatis',
    description: 'Sistem membaca teks dari foto KTP dan KK menggunakan teknologi Optical Character Recognition, menghilangkan kebutuhan input manual.',
    color: '#1e40af',
    bg: 'rgba(30,64,175,0.06)',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1e40af" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 0 0 3.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0 1 20.25 6v1.5m0 9V18A2.25 2.25 0 0 1 18 20.25h-1.5m-9 0H6A2.25 2.25 0 0 1 3.75 18v-1.5M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      </svg>
    ),
  },
  {
    title: 'Pemeriksaan Kualitas Dokumen',
    description: 'AI mendeteksi apakah foto dokumen cukup jelas, tidak buram, dan tidak terpotong sebelum permohonan diproses.',
    color: '#7c3aed',
    bg: 'rgba(124,58,237,0.06)',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
  },
  {
    title: 'Pengisian Formulir Otomatis',
    description: 'Data hasil pembacaan AI (nama, NIK, tanggal lahir, alamat) langsung mengisi formulir permohonan, warga hanya perlu memverifikasi.',
    color: '#059669',
    bg: 'rgba(5,150,105,0.06)',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
      </svg>
    ),
  },
  {
    title: 'Rekomendasi Jenis Surat',
    description: 'Berdasarkan keperluan yang ditulis warga, AI merekomendasikan jenis surat yang paling sesuai dari 6 layanan yang tersedia.',
    color: '#d97706',
    bg: 'rgba(217,119,6,0.06)',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
      </svg>
    ),
  },
  {
    title: 'Asisten Virtual Berbasis Gemini',
    description: 'Chatbot bertenaga Gemini AI menjawab pertanyaan seputar layanan desa secara real-time, terbatas hanya pada topik administrasi Desa Wates.',
    color: '#0891b2',
    bg: 'rgba(8,145,178,0.06)',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
      </svg>
    ),
  },
  {
    title: 'Penerbitan Surat Digital',
    description: 'Setelah disetujui admin, surat keterangan resmi dihasilkan secara otomatis sesuai format dinas dan siap dicetak atau disimpan sebagai PDF.',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.06)',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    ),
  },
]

export default function FeaturesSection() {
  return (
    <section className="py-20 bg-white" id="fitur" aria-label="Fitur unggulan AI">
      <div className="max-w-[1280px] mx-auto px-4">

        {/* Header */}
        <div className="text-center mb-14">
          <span
            className="inline-block px-3 py-1 rounded-full text-[13px] font-medium mb-4"
            style={{ background: 'rgba(16,185,129,0.08)', color: '#059669' }}
          >
            Teknologi AI Terintegrasi
          </span>
          <h2 className="font-medium text-[36px] text-[#1a1a1a] leading-10 tracking-[0.37px]">
            Fitur Kecerdasan Buatan
          </h2>
          <p className="mt-4 text-[18px] text-[#6b7280] leading-7 max-w-[600px] mx-auto">
            SADEWA mengintegrasikan AI di setiap tahap proses administrasi untuk
            kecepatan, akurasi, dan kemudahan layanan
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <article
              key={f.title}
              className="border border-[#e5e7eb] rounded-xl p-6 hover:border-transparent transition-all duration-200 group"
              style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = `0 4px 20px ${f.color}20`
                e.currentTarget.style.borderColor = `${f.color}30`
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)'
                e.currentTarget.style.borderColor = '#e5e7eb'
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: f.bg }}
              >
                {f.icon}
              </div>
              <h3 className="font-semibold text-[16px] text-[#1a1a1a] leading-6 mb-2">
                {f.title}
              </h3>
              <p className="text-[14px] text-[#6b7280] leading-6">
                {f.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
