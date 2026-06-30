import { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'
import { updateProfile } from '../../services/authService'
import { getMyRequests } from '../../services/documentService'
import { useAuthContext } from '../../context/AuthContext'
import { SERVICE_TYPE_LABELS, REQUEST_STATUS_LABELS } from '../../utils/constants'
import { formatDate } from '../../utils/formatDate'

// ── Constants ─────────────────────────────────────────────────────────────────

const HERO_GRADIENT = 'linear-gradient(90deg, #1e40af 0%, #10b981 100%)'
const CARD_SHADOW   = { boxShadow: '0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)' }

const STATUS_CFG = {
  pending:   { label: 'Menunggu',  color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  approved:  { label: 'Disetujui', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  rejected:  { label: 'Ditolak',   color: '#ef4444', bg: 'rgba(239,68,68,0.1)'  },
  completed: { label: 'Selesai',   color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
}

const DEMO_REQUESTS = [
  { id: 'd1', service_type: 'sktm',    status: 'completed', created_at: '2026-06-25T08:00:00Z' },
  { id: 'd2', service_type: 'domisili', status: 'pending',   created_at: '2026-06-28T10:00:00Z' },
]

// ── Icons ─────────────────────────────────────────────────────────────────────

function UserIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, syncProfile } = useAuthContext()

  const [name, setName]         = useState('')
  const [nik, setNik]           = useState('')
  const [requests, setRequests] = useState([])
  const [loadingReq, setLoadingReq] = useState(true)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => {
    if (user) {
      setName(user.name ?? '')
      setNik(user.nik ?? '')
    }
  }, [user])

  useEffect(() => {
    async function load() {
      if (!user) return
      if (!supabase) { setRequests(DEMO_REQUESTS); setLoadingReq(false); return }
      const data = await getMyRequests(user.id)
      setRequests(data)
      setLoadingReq(false)
    }
    load()
  }, [user])

  async function handleSave(e) {
    e.preventDefault()
    if (!name.trim()) { setError('Nama tidak boleh kosong.'); return }
    if (nik && !/^\d{16}$/.test(nik)) { setError('NIK harus 16 digit angka.'); return }

    setError('')
    setSaving(true)

    if (supabase) {
      const result = await updateProfile(user.id, { full_name: name.trim(), nik: nik.trim() || null })
      if (!result.ok) { setError(result.message); setSaving(false); return }
    } else {
      await new Promise(r => setTimeout(r, 600))
    }

    syncProfile({ name: name.trim(), nik: nik.trim() || null })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  // Stats
  const total    = requests.length
  const done     = requests.filter(r => r.status === 'completed').length
  const pending  = requests.filter(r => r.status === 'pending' || r.status === 'approved').length
  const rejected = requests.filter(r => r.status === 'rejected').length

  const initials = (user?.name ?? 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div>
      {/* Hero */}
      <section style={{ background: HERO_GRADIENT }} className="py-8">
        <div className="max-w-[1280px] mx-auto px-4">
          <h1 className="font-medium text-[36px] text-white leading-10 tracking-[0.37px]">Profil Saya</h1>
          <p className="mt-2 text-[16px] leading-6" style={{ color: 'rgba(255,255,255,0.9)' }}>
            Kelola informasi akun dan pantau riwayat permohonan Anda
          </p>
        </div>
      </section>

      <div className="max-w-[1280px] mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 pt-8">

          {/* ── Left: identity card ── */}
          <div className="flex flex-col gap-4">

            {/* Avatar + info */}
            <div className="bg-white border border-[#e5e7eb] rounded-lg p-6 flex flex-col items-center text-center" style={CARD_SHADOW}>
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                style={{ background: HERO_GRADIENT }}
              >
                {user?.name ? (
                  <span className="font-semibold text-[22px] text-white">{initials}</span>
                ) : (
                  <UserIcon />
                )}
              </div>
              <p className="font-semibold text-[18px] text-[#1a1a1a] leading-6">{user?.name ?? '—'}</p>
              <p className="text-[13px] text-[#6b7280] mt-1">{user?.email ?? '—'}</p>
              <span className="mt-3 px-3 py-1 rounded-full text-[12px] font-medium"
                style={{ background: 'rgba(30,64,175,0.1)', color: '#1e40af' }}>
                Warga
              </span>
              {user?.nik && (
                <p className="mt-3 text-[12px] text-[#9ca3af]" style={{ fontFamily: 'Menlo, monospace' }}>
                  NIK: {user.nik}
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="bg-white border border-[#e5e7eb] rounded-lg p-5" style={CARD_SHADOW}>
              <p className="text-[13px] font-medium text-[#6b7280] uppercase tracking-wide mb-4">Statistik Permohonan</p>
              {[
                { label: 'Total', value: total,    color: '#1e40af' },
                { label: 'Selesai', value: done,   color: '#10b981' },
                { label: 'Dalam Proses', value: pending,  color: '#f59e0b' },
                { label: 'Ditolak', value: rejected, color: '#ef4444' },
              ].map(s => (
                <div key={s.label} className="flex justify-between items-center py-2 border-b border-[#f3f4f6] last:border-0">
                  <span className="text-[13px] text-[#6b7280]">{s.label}</span>
                  <span className="font-semibold text-[16px]" style={{ color: s.color }}>
                    {loadingReq ? '–' : s.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: edit form + history ── */}
          <div className="flex flex-col gap-5">

            {/* Edit form */}
            <div className="bg-white border border-[#e5e7eb] rounded-lg" style={CARD_SHADOW}>
              <div className="px-6 py-5 border-b border-[#e5e7eb] flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="1.75">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                </svg>
                <h2 className="font-medium text-[16px] text-[#1a1a1a]">Edit Informasi Profil</h2>
              </div>
              <form onSubmit={handleSave} className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                  {/* Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Nama Lengkap</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Nama sesuai KTP"
                      className="w-full h-10 px-3.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg text-[14px] text-[#1a1a1a] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#1e40af] focus:border-transparent"
                    />
                  </div>

                  {/* NIK */}
                  <div>
                    <label className="block text-[13px] font-medium text-[#374151] mb-1.5">NIK</label>
                    <input
                      type="text"
                      value={nik}
                      onChange={e => setNik(e.target.value.replace(/\D/g, '').slice(0, 16))}
                      placeholder="16 digit NIK"
                      className="w-full h-10 px-3.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg text-[14px] text-[#1a1a1a] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#1e40af] focus:border-transparent"
                      style={{ fontFamily: 'Menlo, monospace', letterSpacing: '1px' }}
                    />
                  </div>

                  {/* Email (read-only) */}
                  <div>
                    <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
                      Email <span className="text-[#9ca3af] font-normal">(tidak dapat diubah)</span>
                    </label>
                    <input
                      type="email"
                      value={user?.email ?? ''}
                      disabled
                      className="w-full h-10 px-3.5 bg-[#f3f4f6] border border-[#e5e7eb] rounded-lg text-[14px] text-[#9ca3af] opacity-70"
                    />
                  </div>
                </div>

                {error && (
                  <p className="mt-4 text-[13px] text-red-500">{error}</p>
                )}

                <div className="mt-6 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 h-10 px-6 rounded-lg text-[14px] font-medium text-white cursor-pointer border-0 hover:opacity-90 transition-opacity disabled:opacity-60"
                    style={{ background: HERO_GRADIENT }}
                  >
                    {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                  {saved && (
                    <span className="flex items-center gap-1.5 text-[13px] font-medium text-green-600">
                      <CheckIcon /> Tersimpan
                    </span>
                  )}
                </div>
              </form>
            </div>

            {/* Recent requests */}
            <div className="bg-white border border-[#e5e7eb] rounded-lg overflow-hidden" style={CARD_SHADOW}>
              <div className="px-6 py-5 border-b border-[#e5e7eb]">
                <h2 className="font-medium text-[16px] text-[#1a1a1a]">Riwayat Permohonan</h2>
              </div>
              {loadingReq ? (
                <div className="flex justify-center py-10">
                  <svg className="animate-spin w-6 h-6 text-[#1e40af]" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="#e5e7eb" strokeWidth="3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="#1e40af" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </div>
              ) : requests.length === 0 ? (
                <p className="px-6 py-10 text-center text-[14px] text-[#6b7280]">Belum ada permohonan</p>
              ) : (
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
                      <th className="px-6 py-3 text-left text-[12px] font-medium text-[#6b7280] uppercase tracking-wide">No.</th>
                      <th className="px-6 py-3 text-left text-[12px] font-medium text-[#6b7280] uppercase tracking-wide">Layanan</th>
                      <th className="px-6 py-3 text-left text-[12px] font-medium text-[#6b7280] uppercase tracking-wide">Tanggal</th>
                      <th className="px-6 py-3 text-left text-[12px] font-medium text-[#6b7280] uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...requests]
                      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                      .map((req, i) => {
                        const s = STATUS_CFG[req.status] ?? STATUS_CFG.pending
                        return (
                          <tr key={req.id} className="border-b border-[#f3f4f6] hover:bg-[#fafafa] transition-colors">
                            <td className="px-6 py-3.5" style={{ fontFamily: 'Menlo, monospace', fontSize: '11px', color: '#9ca3af' }}>
                              REQ-{req.id.slice(-6).toUpperCase()}
                            </td>
                            <td className="px-6 py-3.5 font-medium text-[#1a1a1a]">
                              {SERVICE_TYPE_LABELS[req.service_type] ?? req.service_type}
                            </td>
                            <td className="px-6 py-3.5 text-[#6b7280]">{formatDate(req.created_at)}</td>
                            <td className="px-6 py-3.5">
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium"
                                style={{ background: s.bg, color: s.color }}>
                                {s.label}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
