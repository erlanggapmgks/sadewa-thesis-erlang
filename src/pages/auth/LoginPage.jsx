import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ROUTES } from '../../routes/routes'
import { useAuthContext } from '../../context/AuthContext'

// ── Icons ────────────────────────────────────────────────────────────────────

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  )
}

// ── Demo accounts ────────────────────────────────────────────────────────────

const DEMO_ACCOUNTS = [
  { label: 'Warga (Demo)',  email: 'warga@demo.id', password: 'demo1234' },
  { label: 'Admin (Demo)', email: 'admin@demo.id',  password: 'demo1234' },
]

// ── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthContext()
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting]     = useState(false)
  const [error, setError]               = useState('')

  function fillDemo(account) {
    setEmail(account.email)
    setPassword(account.password)
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('Email dan kata sandi wajib diisi.')
      return
    }
    setSubmitting(true)
    const result = await login(email, password)
    setSubmitting(false)
    if (!result.ok) {
      setError(result.message)
      return
    }
    navigate(result.home, { replace: true })
  }

  const inputBase =
    'w-full h-10 bg-[#f9fafb] border border-[#e5e7eb] rounded-[6px] px-[13px] text-[14px] text-[#1a1a1a] placeholder-[#6b7280] tracking-[-0.15px] focus:outline-none focus:ring-2 focus:ring-[#1e40af] focus:border-transparent'

  return (
    <div
      className="w-full max-w-[560px] bg-white border border-[#e5e7eb] rounded-lg overflow-hidden"
      style={{ boxShadow: '0px 20px 12.5px rgba(0,0,0,0.1), 0px 8px 5px rgba(0,0,0,0.1)' }}
    >
      {/* Card header */}
      <div className="px-6 pt-6 pb-4">
        <h1 className="font-medium text-[18px] text-[#1a1a1a] leading-[18px] tracking-[-0.89px]">
          Selamat Datang Kembali
        </h1>
        <p className="mt-1.5 text-[14px] text-[#6b7280] leading-5 tracking-[-0.15px]">
          Masuk untuk mengakses akun dan layanan Anda
        </p>
      </div>

      {/* Card content */}
      <div className="px-6 pb-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="font-medium text-[14px] text-[#1a1a1a] leading-5 tracking-[-0.15px]">
              Alamat Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email.anda@contoh.com"
              className={inputBase}
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="font-medium text-[14px] text-[#1a1a1a] leading-5 tracking-[-0.15px]">
              Kata Sandi
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi Anda"
                className={`${inputBase} pr-10`}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#1a1a1a] transition-colors cursor-pointer"
                aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 leading-5">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 bg-[#1e40af] rounded-lg text-white font-medium text-[16px] leading-6 tracking-[-0.31px] hover:bg-[#1e3a8a] transition-colors cursor-pointer border-0 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        {/* Demo accounts */}
        <div className="mt-6 relative flex items-center">
          <div className="flex-1 border-t border-[#e5e7eb]" />
          <span className="mx-3 bg-white text-[12px] text-[#6b7280] leading-5 shrink-0">Akun Demo</span>
          <div className="flex-1 border-t border-[#e5e7eb]" />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.label}
              type="button"
              onClick={() => fillDemo(acc)}
              className="h-9 bg-white border border-[#e5e7eb] rounded-lg text-[13px] font-medium text-[#1a1a1a] leading-5 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              {acc.label}
            </button>
          ))}
        </div>

        {/* Register link */}
        <p className="mt-5 text-center text-[14px] text-[#6b7280] leading-5 tracking-[-0.15px]">
          Belum punya akun?{' '}
          <Link to={ROUTES.REGISTER} className="font-medium text-[#1e40af] no-underline hover:underline">
            Daftar Sekarang
          </Link>
        </p>
      </div>
    </div>
  )
}
