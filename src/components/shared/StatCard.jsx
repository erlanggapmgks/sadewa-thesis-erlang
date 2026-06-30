// Summary statistic card shown on dashboards across all roles.
// Shows: icon, label, and a big number.
//
// Usage:
//   <StatCard label="Total Pengajuan" value={42} icon="📄" trend="+5 minggu ini" />

export default function StatCard({ label, value, icon, trend, color = 'emerald' }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-lg bg-${color}-100 flex items-center justify-center text-2xl`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        {trend && <p className="text-xs text-gray-400 mt-0.5">{trend}</p>}
      </div>
    </div>
  )
}
