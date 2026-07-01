import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'

// ── Icons ────────────────────────────────────────────────────────────────────

function UsersIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1e40af" strokeWidth="1.75" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  )
}

function MapIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.75" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
    </svg>
  )
}

function BuildingIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1e40af" strokeWidth="1.75" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
    </svg>
  )
}

function TrendUpIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.75" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
    </svg>
  )
}

// ── Data ─────────────────────────────────────────────────────────────────────

const STATS = [
  { value: '1.927 ha', label: 'Luas Wilayah',   icon: <MapIcon /> },
  { value: '3',        label: 'Jumlah Dusun',    icon: <BuildingIcon /> },
  { value: '±3 km',   label: 'Jarak ke Kecamatan', icon: <TrendUpIcon /> },
  { value: '4',        label: 'Batas Wilayah',   icon: <UsersIcon /> },
]

const SEJARAH_PARAGRAPHS = [
  'Desa Wates adalah salah satu desa yang terletak di Kecamatan Tanjunganom, Kabupaten Nganjuk, Provinsi Jawa Timur. Desa yang asri ini memiliki luas wilayah sekitar 1.927 hektar dan berjarak kurang lebih 3 kilometer ke arah barat dari pusat Kecamatan Tanjunganom.',
  'Secara geografis, Desa Wates berbatasan langsung dengan Desa Ngadirejo di sebelah utara, Desa Banjaranyar di sebelah timur, Desa Sumberkepuh di sebelah selatan, dan Desa Malangsari di sebelah barat. Wilayah desa terbagi menjadi tiga dusun, yaitu Dusun Wates, Dusun Pulorejo, dan Dusun Ngrowo.',
  'Dengan semangat gotong royong yang kuat dan komitmen terhadap pelayanan masyarakat, Desa Wates terus berinovasi. Peluncuran sistem administrasi digital SADEWA pada tahun 2026 menandai babak baru, menjadikan Desa Wates sebagai salah satu desa pertama di wilayah ini yang menawarkan layanan administrasi warga secara online.',
]

const MISI_ITEMS = [
  'Memberikan pelayanan publik yang efisien, transparan, dan mudah diakses seluruh warga',
  'Mendorong pengembangan ekonomi dan kewirausahaan masyarakat desa',
  'Meningkatkan fasilitas pendidikan dan kesehatan warga Desa Wates',
  'Melestarikan nilai budaya lokal dan keberlanjutan lingkungan hidup',
]

const BATAS_WILAYAH = [
  { arah: 'Utara',   desa: 'Desa Ngadirejo' },
  { arah: 'Timur',   desa: 'Desa Banjaranyar' },
  { arah: 'Selatan', desa: 'Desa Sumberkepuh' },
  { arah: 'Barat',   desa: 'Desa Malangsari' },
]

const STRUKTUR = [
  { name: 'Wijisianti Priatna, S.Pd.', role: 'Kepala Desa',            period: 'Menjabat' },
  { name: 'Lilik Eko Prasetyo, S.AP.', role: 'Sekretaris Desa',        period: 'Menjabat' },
  { name: 'Hartini',                   role: 'Kepala Dusun Wates',     period: 'Menjabat' },
  { name: 'Endang Susilowati',         role: 'Kepala Dusun Pulorejo',  period: 'Menjabat' },
  { name: 'Isminingsih',               role: 'Kepala Dusun Ngrowo',    period: 'Menjabat' },
]

const HERO_GRADIENT = 'linear-gradient(170.67deg, #1e40af 0%, #10b981 100%)'

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ value, label, icon }) {
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-lg shadow-sm p-6 flex flex-col gap-2">
      <div>{icon}</div>
      <p className="font-semibold text-[30px] text-[#1a1a1a] leading-9 tracking-[0.4px] mt-2">
        {value}
      </p>
      <p className="text-sm text-[#6b7280] leading-5">
        {label}
      </p>
    </div>
  )
}

function Card({ title, children }) {
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-[#e5e7eb]">
        <h2 className="font-medium text-lg text-[#1a1a1a] tracking-[-0.89px]">{title}</h2>
      </div>
      <div className="px-6 pb-6 pt-4">
        {children}
      </div>
    </div>
  )
}

function OrgRow({ name, role, period }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'rgba(243,244,246,0.3)' }}>
      <div>
        <p className="font-medium text-base text-[#1a1a1a] leading-6">{name}</p>
        <p className="text-sm text-[#6b7280] leading-5">{role}</p>
      </div>
      <p className="text-sm text-[#6b7280] leading-5 shrink-0">{period}</p>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function VillageProfilePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">

        {/* Hero */}
        <section style={{ background: HERO_GRADIENT }} className="py-16">
          <div className="max-w-[1280px] mx-auto px-4">
            <h1 className="font-medium text-[48px] text-white leading-[48px] tracking-[0.35px]">
              Profil Desa Wates
            </h1>
            <p className="mt-4 text-[20px] leading-7 tracking-[-0.45px]" style={{ color: 'rgba(255,255,255,0.9)' }}>
              Mengenal sejarah, visi, dan struktur organisasi pemerintahan desa kami
            </p>
          </div>
        </section>

        {/* Stats — overlap hero by 48px */}
        <div className="relative z-10 -mt-12">
          <div className="max-w-[1280px] mx-auto px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {STATS.map((s) => (
                <StatCard key={s.label} {...s} />
              ))}
            </div>
          </div>
        </div>

        {/* Content sections */}
        <div className="max-w-[1280px] mx-auto px-4">

          {/* Sejarah Desa */}
          <div className="pt-16">
            <Card title="Sejarah Desa">
              <div className="flex flex-col gap-4">
                {SEJARAH_PARAGRAPHS.map((p, i) => (
                  <p key={i} className="text-base text-[#6b7280] leading-6 tracking-[-0.31px]">
                    {p}
                  </p>
                ))}
              </div>
            </Card>
          </div>

          {/* Batas Wilayah */}
          <div className="pt-10">
            <Card title="Batas Wilayah">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {BATAS_WILAYAH.map(({ arah, desa }) => (
                  <div key={arah} className="rounded-lg p-4 text-center" style={{ background: 'rgba(30,64,175,0.04)', border: '1px solid rgba(30,64,175,0.1)' }}>
                    <p className="text-[11px] font-semibold text-[#1e40af] uppercase tracking-widest mb-1">{arah}</p>
                    <p className="text-[14px] text-[#1a1a1a] font-medium">{desa}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Visi & Misi */}
          <div className="pt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Visi */}
            <Card title="Visi">
              <p className="text-base text-[#6b7280] leading-6 tracking-[-0.31px]">
                Menjadi desa yang cerdas, berkelanjutan, dan sejahtera yang memanfaatkan teknologi untuk meningkatkan kualitas hidup warga sembari melestarikan warisan budaya dan lingkungan.
              </p>
            </Card>

            {/* Misi */}
            <Card title="Misi">
              <ul className="flex flex-col gap-2 list-none p-0 m-0">
                {MISI_ITEMS.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#1e40af] text-base leading-6 shrink-0 mt-0">•</span>
                    <span className="text-base text-[#6b7280] leading-6 tracking-[-0.31px]">{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Struktur Organisasi */}
          <div className="py-16">
            <Card title="Struktur Organisasi">
              <div className="flex flex-col gap-4">
                {STRUKTUR.map((person) => (
                  <OrgRow key={person.name} {...person} />
                ))}
              </div>
            </Card>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  )
}
