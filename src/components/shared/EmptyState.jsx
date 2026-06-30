// Shown when a list or table has no data yet.
// Prevents blank white space and gives the user a clear call to action.
//
// Usage:
//   <EmptyState
//     icon="📋"
//     title="Belum ada pengajuan"
//     description="Anda belum mengajukan surat apapun"
//     action={<Button onClick={...}>Ajukan Sekarang</Button>}
//   />

export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <span className="text-5xl mb-4">{icon}</span>}
      <h3 className="text-base font-semibold text-gray-700">{title}</h3>
      {description && <p className="text-sm text-gray-400 mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
