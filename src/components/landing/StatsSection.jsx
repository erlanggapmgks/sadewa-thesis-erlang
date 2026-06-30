// 4 summary stat cards that float on top of the Hero's bottom edge (pulled up via -mt-16 in LandingPage).

function UsersIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  )
}

function DocumentCheckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

function ClipboardIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
    </svg>
  )
}

const STATS = [
  {
    label: 'Warga Terdaftar',
    value: '12.543',
    icon: <UsersIcon />,
    iconColor: 'text-[#1e40af]',
  },
  {
    label: 'Permohonan Diproses',
    value: '8.921',
    icon: <DocumentCheckIcon />,
    iconColor: 'text-[#10b981]',
  },
  {
    label: 'Rata-rata Waktu Proses',
    value: '2,5 hari',
    icon: <ClockIcon />,
    iconColor: 'text-[#1e40af]',
  },
  {
    label: 'Layanan Tersedia',
    value: '6',
    icon: <ClipboardIcon />,
    iconColor: 'text-[#f59e0b]',
  },
]

function StatCard({ label, value, icon, iconColor }) {
  return (
    <article className="bg-white border border-[#e5e7eb] rounded-lg p-6 flex items-start justify-between shadow-sm">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-[#6b7280] font-normal leading-5">{label}</p>
        <p className="text-[30px] font-semibold text-[#1a1a1a] leading-9 tracking-[0.4px]">{value}</p>
      </div>
      <div className={`bg-[#f3f4f6] rounded-lg p-3 shrink-0 ${iconColor}`}>
        {icon}
      </div>
    </article>
  )
}

export default function StatsSection() {
  return (
    <section aria-label="Statistik layanan">
      <div className="max-w-[1280px] mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </div>
    </section>
  )
}
