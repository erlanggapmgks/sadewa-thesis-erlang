const HERO_GRADIENT = 'linear-gradient(90deg, #1e40af 0%, #10b981 100%)'
const CARD_SHADOW   = { boxShadow: '0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)' }

const VILLAGE_INFO = [
  { label: 'Nama Desa',         value: 'Desa Wates' },
  { label: 'Kecamatan',         value: 'Kecamatan Wates' },
  { label: 'Kabupaten',         value: 'Kabupaten Kulon Progo' },
  { label: 'Provinsi',          value: 'Daerah Istimewa Yogyakarta' },
  { label: 'Kode Pos',          value: '55611' },
  { label: 'Alamat Balai Desa', value: 'Jl. Stasiun No. 5, Wates, Kulon Progo' },
  { label: 'Telepon',           value: '(0274) 773132' },
  { label: 'Email Resmi',       value: 'deswates@kulonprogokab.go.id' },
]

const SERVICE_HOURS = [
  { day: 'Senin',  open: '08.00', close: '15.00' },
  { day: 'Selasa', open: '08.00', close: '15.00' },
  { day: 'Rabu',   open: '08.00', close: '15.00' },
  { day: 'Kamis',  open: '08.00', close: '15.00' },
  { day: 'Jumat',  open: '08.00', close: '11.30' },
  { day: 'Sabtu',  open: null,    close: null },
  { day: 'Minggu', open: null,    close: null },
]

const SYSTEM_INFO = [
  { label: 'Nama Sistem',    value: 'SADEWA' },
  { label: 'Versi',          value: '1.0.0' },
  { label: 'Database',       value: 'Supabase (PostgreSQL)' },
  { label: 'AI Engine',      value: 'Google Gemini 1.5 Flash' },
  { label: 'Frontend',       value: 'React 19 + Vite + Tailwind CSS v4' },
  { label: 'Authentication', value: 'Supabase Auth (Row Level Security)' },
]

function SectionCard({ title, icon, children }) {
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-lg" style={CARD_SHADOW}>
      <div className="flex items-center gap-2 px-6 py-5 border-b border-[#e5e7eb]">
        {icon}
        <h2 className="font-medium text-[16px] text-[#1a1a1a]">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-start gap-4 py-2.5 border-b border-[#f3f4f6] last:border-0">
      <span className="text-[13px] text-[#6b7280] shrink-0">{label}</span>
      <span className="text-[13px] font-medium text-[#1a1a1a] text-right">{value}</span>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <div>
      <section style={{ background: HERO_GRADIENT }} className="py-8">
        <div className="max-w-[1280px] mx-auto px-4">
          <h1 className="font-medium text-[36px] text-white leading-10 tracking-[0.37px]">Pengaturan Sistem</h1>
          <p className="mt-2 text-[16px] leading-6" style={{ color: 'rgba(255,255,255,0.9)' }}>
            Informasi desa dan konfigurasi umum aplikasi SADEWA
          </p>
        </div>
      </section>

      <div className="max-w-[1280px] mx-auto px-4 py-8 pb-12 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* Village info */}
        <SectionCard
          title="Informasi Desa"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="1.75">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12 11.204 3.045c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          }
        >
          {VILLAGE_INFO.map(r => <InfoRow key={r.label} {...r} />)}
        </SectionCard>

        <div className="flex flex-col gap-6">

          {/* Service hours */}
          <SectionCard
            title="Jam Pelayanan"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="1.75">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            }
          >
            {SERVICE_HOURS.map(h => (
              <div key={h.day} className="flex justify-between items-center py-2.5 border-b border-[#f3f4f6] last:border-0">
                <span className="text-[13px] text-[#6b7280] w-20">{h.day}</span>
                {h.open ? (
                  <span className="text-[13px] font-medium text-[#1a1a1a]">{h.open} – {h.close} WIB</span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium"
                    style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}>
                    Tutup
                  </span>
                )}
              </div>
            ))}
          </SectionCard>

          {/* System info */}
          <SectionCard
            title="Informasi Sistem"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="1.75">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0H3" />
              </svg>
            }
          >
            {SYSTEM_INFO.map(r => <InfoRow key={r.label} {...r} />)}
            <div className="mt-4 pt-4 border-t border-[#f3f4f6]">
              <div className="flex items-start gap-2 p-3 rounded-lg"
                style={{ background: 'rgba(30,64,175,0.05)', border: '1px solid rgba(30,64,175,0.1)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1e40af" strokeWidth="2" className="shrink-0 mt-0.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                </svg>
                <p className="text-[12px] text-[#1e40af] leading-5">
                  Sistem ini dikembangkan sebagai proyek tesis. Konfigurasi lanjutan dapat diatur langsung melalui Supabase Dashboard.
                </p>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
