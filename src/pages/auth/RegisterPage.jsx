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

function IdCardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.75" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z" />
    </svg>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuthContext()

  const [form, setForm] = useState({
    nama: '',
    nik: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword]               = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agree, setAgree]       = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors]     = useState({})
  const [serverError, setServerError] = useState('')

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  function validate() {
    const e = {}
    if (!form.nama.trim())                        e.nama = 'Nama lengkap wajib diisi.'
    if (!/^\d{16}$/.test(form.nik))               e.nik  = 'NIK harus terdiri dari 16 digit angka.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Format email tidak valid.'
    if (form.password.length < 8)                 e.password = 'Kata sandi minimal 8 karakter.'
    if (form.password !== form.confirmPassword)   e.confirmPassword = 'Kata sandi tidak cocok.'
    if (!agree)                                   e.agree = 'Anda harus menyetujui syarat dan ketentuan.'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setServerError('')
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }
    setSubmitting(true)
    const result = await register(form.email, form.password, form.nama, form.nik)
    setSubmitting(false)
    if (!result.ok) {
      setServerError(result.message)
      return
    }
    navigate(ROUTES.CITIZEN_DASHBOARD, { replace: true })
  }

  const inputBase =
    'w-full h-10 bg-[#f9fafb] border border-[#e5e7eb] rounded-[6px] px-[13px] text-[14px] text-[#1a1a1a] placeholder-[#6b7280] tracking-[-0.15px] focus:outline-none focus:ring-2 focus:ring-[#1e40af] focus:border-transparent'

  const inputError = 'border-red-400 focus:ring-red-400'

  return (
    <div
      className="w-full max-w-[560px] bg-white border border-[#e5e7eb] rounded-lg overflow-hidden"
      style={{ boxShadow: '0px 20px 12.5px rgba(0,0,0,0.1), 0px 8px 5px rgba(0,0,0,0.1)' }}
    >
      {/* Card header */}
      <div className="px-6 pt-6 pb-4">
        <h1 className="font-medium text-[18px] text-[#1a1a1a] leading-[18px] tracking-[-0.89px]">
          Buat Akun Baru
        </h1>
        <p className="mt-1.5 text-[14px] text-[#6b7280] leading-5 tracking-[-0.15px]">
          Daftarkan diri Anda untuk mengakses layanan SADEWA
        </p>
      </div>

      {/* Card content */}
      <div className="px-6 pb-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>

          {/* Nama Lengkap */}
          <div className="flex flex-col gap-1.5">
            <label className="font-medium text-[14px] text-[#1a1a1a] leading-5 tracking-[-0.15px]">
              Nama Lengkap
            </label>
            <input
              type="text"
              name="nama"
              value={form.nama}
              onChange={handleChange}
              placeholder="Masukkan nama lengkap Anda"
              className={`${inputBase} ${errors.nama ? inputError : ''}`}
              autoComplete="name"
            />
            {errors.nama && <p className="text-[12px] text-red-500 leading-4">{errors.nama}</p>}
          </div>

          {/* NIK */}
          <div className="flex flex-col gap-1.5">
            <label className="font-medium text-[14px] text-[#1a1a1a] leading-5 tracking-[-0.15px]">
              NIK
              <span className="ml-1 font-normal text-[#6b7280]">(16 digit)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="nik"
                value={form.nik}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 16)
                  setForm((prev) => ({ ...prev, nik: v }))
                  if (errors.nik) setErrors((prev) => ({ ...prev, nik: '' }))
                }}
                placeholder="Nomor Induk Kependudukan"
                maxLength={16}
                className={`${inputBase} pr-10 ${errors.nik ? inputError : ''}`}
                autoComplete="off"
                inputMode="numeric"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280]">
                <IdCardIcon />
              </span>
            </div>
            {errors.nik
              ? <p className="text-[12px] text-red-500 leading-4">{errors.nik}</p>
              : <p className="text-[12px] text-[#6b7280] leading-4">Sesuai KTP yang berlaku</p>
            }
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="font-medium text-[14px] text-[#1a1a1a] leading-5 tracking-[-0.15px]">
              Alamat Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="email.anda@contoh.com"
              className={`${inputBase} ${errors.email ? inputError : ''}`}
              autoComplete="email"
            />
            {errors.email && <p className="text-[12px] text-red-500 leading-4">{errors.email}</p>}
          </div>

          {/* Kata Sandi */}
          <div className="flex flex-col gap-1.5">
            <label className="font-medium text-[14px] text-[#1a1a1a] leading-5 tracking-[-0.15px]">
              Kata Sandi
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Minimal 8 karakter"
                className={`${inputBase} pr-10 ${errors.password ? inputError : ''}`}
                autoComplete="new-password"
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
            {errors.password && <p className="text-[12px] text-red-500 leading-4">{errors.password}</p>}
          </div>

          {/* Konfirmasi Kata Sandi */}
          <div className="flex flex-col gap-1.5">
            <label className="font-medium text-[14px] text-[#1a1a1a] leading-5 tracking-[-0.15px]">
              Konfirmasi Kata Sandi
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Ulangi kata sandi Anda"
                className={`${inputBase} pr-10 ${errors.confirmPassword ? inputError : ''}`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#1a1a1a] transition-colors cursor-pointer"
                aria-label={showConfirmPassword ? 'Sembunyikan konfirmasi' : 'Tampilkan konfirmasi'}
              >
                {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-[12px] text-red-500 leading-4">{errors.confirmPassword}</p>}
          </div>

          {/* Terms */}
          <div className="flex flex-col gap-1">
            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => { setAgree(e.target.checked); setErrors((prev) => ({ ...prev, agree: '' })) }}
                className="mt-0.5 w-3.5 h-3.5 accent-[#1e40af] cursor-pointer shrink-0"
              />
              <span className="text-[14px] text-[#6b7280] leading-5 tracking-[-0.15px]">
                Saya menyetujui{' '}
                <span className="text-[#1e40af] font-medium cursor-pointer hover:underline">
                  Syarat & Ketentuan
                </span>{' '}
                dan{' '}
                <span className="text-[#1e40af] font-medium cursor-pointer hover:underline">
                  Kebijakan Privasi
                </span>{' '}
                SADEWA
              </span>
            </label>
            {errors.agree && <p className="text-[12px] text-red-500 leading-4 pl-5">{errors.agree}</p>}
          </div>

          {/* Server error */}
          {serverError && (
            <p className="text-[12px] text-red-500 leading-4">{serverError}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 bg-[#1e40af] rounded-lg text-white font-medium text-[16px] leading-6 tracking-[-0.31px] hover:bg-[#1e3a8a] transition-colors cursor-pointer border-0 mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? 'Mendaftarkan...' : 'Daftar Sekarang'}
          </button>

        </form>

        {/* Login link */}
        <p className="mt-5 text-center text-[14px] text-[#6b7280] leading-5 tracking-[-0.15px]">
          Sudah punya akun?{' '}
          <Link to={ROUTES.LOGIN} className="font-medium text-[#1e40af] no-underline hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  )
}
