// Standard top-of-page header row with title, optional subtitle, and optional action slot.
// Used at the top of every page to keep headers visually consistent.
//
// Usage:
//   <PageHeader
//     title="Kelola Pengajuan"
//     subtitle="Daftar semua pengajuan surat dari warga"
//     action={<Button>Export</Button>}
//   />

export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
