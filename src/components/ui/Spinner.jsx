// Full-page or inline loading spinner.
//
// Props:
//   fullPage: boolean — if true, centers spinner in the viewport

export default function Spinner({ fullPage = false }) {
  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      <span className="text-sm text-gray-500">Memuat...</span>
    </div>
  )

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80">
        {spinner}
      </div>
    )
  }

  return spinner
}
