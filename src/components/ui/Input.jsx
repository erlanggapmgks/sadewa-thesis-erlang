// Base text input component.
// Handles label, error message, and helper text in one wrapper.
//
// Props:
//   label: string
//   error: string — shows below input in red when truthy
//   helper: string — shows below input in gray
//   All standard HTML input props (type, placeholder, value, onChange, etc.)

export default function Input({ label, error, helper, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      <input
        className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-800 placeholder-gray-400 transition focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
          error ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {helper && !error && <p className="text-xs text-gray-500">{helper}</p>}
    </div>
  )
}
