import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../services/supabase'
import { getAllProfiles, updateUserRole } from '../../services/authService'
import { useAuthContext } from '../../context/AuthContext'
import { formatDate } from '../../utils/formatDate'

// ── Constants ─────────────────────────────────────────────────────────────────

const HERO_GRADIENT = 'linear-gradient(90deg, #1e40af 0%, #10b981 100%)'
const CARD_SHADOW   = { boxShadow: '0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)' }

const ROLE_CFG = {
  citizen: { label: 'Warga',  bg: 'rgba(30,64,175,0.08)', color: '#1e40af' },
  admin:   { label: 'Admin',  bg: 'rgba(16,185,129,0.1)', color: '#059669' },
}

const DEMO_USERS = [
  { id: 'demo-citizen', full_name: 'Daniel Abraham', email: 'warga@demo.id',  role: 'citizen', created_at: '2026-06-01T08:00:00Z' },
  { id: 'demo-admin',   full_name: 'Admin Desa',     email: 'admin@demo.id',  role: 'admin',   created_at: '2026-01-01T08:00:00Z' },
  { id: 'c2', full_name: 'Siti Rahayu',    email: 'siti@example.com',   role: 'citizen', created_at: '2026-06-05T09:00:00Z' },
  { id: 'c3', full_name: 'Budi Kurniawan', email: 'budi@example.com',   role: 'citizen', created_at: '2026-06-08T10:00:00Z' },
  { id: 'c4', full_name: 'Maya Lestari',   email: 'maya@example.com',   role: 'citizen', created_at: '2026-06-10T11:00:00Z' },
]

// ── Icons ─────────────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  )
}

// ── Confirm dialog ────────────────────────────────────────────────────────────

function ConfirmDialog({ user: target, newRole, onConfirm, onCancel }) {
  const cfg = ROLE_CFG[newRole]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white rounded-xl p-6 max-w-sm w-full" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <h3 className="font-semibold text-[17px] text-[#1a1a1a] mb-2">Ubah Peran Pengguna</h3>
        <p className="text-[14px] text-[#6b7280] leading-6 mb-5">
          Ubah peran <strong className="text-[#1a1a1a]">{target.full_name}</strong> menjadi{' '}
          <span className="font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>?
          {newRole === 'admin' && (
            <> Pengguna ini akan mendapatkan akses penuh ke panel admin.</>
          )}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 h-10 rounded-lg text-[14px] font-medium text-[#6b7280] border border-[#e5e7eb] bg-white hover:bg-[#f3f4f6] transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-10 rounded-lg text-[14px] font-medium text-white cursor-pointer border-0 hover:opacity-90 transition-opacity"
            style={{ background: newRole === 'admin' ? '#10b981' : '#1e40af' }}
          >
            Ya, Ubah
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ManageUsersPage() {
  const { user: currentUser } = useAuthContext()

  const [users, setUsers]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [roleFilter, setRoleFilter] = useState('semua')
  const [confirm, setConfirm]     = useState(null)   // { target, newRole }
  const [toasting, setToasting]   = useState(null)   // success message

  useEffect(() => {
    async function load() {
      if (!supabase) { setUsers(DEMO_USERS); setLoading(false); return }
      const data = await getAllProfiles()
      setUsers(data)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    let list = users
    if (roleFilter !== 'semua') list = list.filter(u => u.role === roleFilter)
    const q = search.toLowerCase().trim()
    if (q) list = list.filter(u =>
      u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    )
    return list
  }, [users, search, roleFilter])

  function requestRoleChange(target, newRole) {
    if (target.id === currentUser?.id) {
      alert('Anda tidak dapat mengubah peran akun Anda sendiri.')
      return
    }
    setConfirm({ target, newRole })
  }

  async function confirmRoleChange() {
    const { target, newRole } = confirm
    setConfirm(null)

    if (supabase) {
      const result = await updateUserRole(target.id, newRole)
      if (!result.ok) { alert('Gagal mengubah peran: ' + result.message); return }
    } else {
      await new Promise(r => setTimeout(r, 400))
    }

    setUsers(prev => prev.map(u => u.id === target.id ? { ...u, role: newRole } : u))
    setToasting(`Peran ${target.full_name} berhasil diubah menjadi ${ROLE_CFG[newRole].label}`)
    setTimeout(() => setToasting(null), 3500)
  }

  function avatarInitials(name) {
    return (name ?? 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  }

  const totalCitizens = users.filter(u => u.role === 'citizen').length
  const totalAdmins   = users.filter(u => u.role === 'admin').length

  return (
    <>
      {/* Confirm dialog */}
      {confirm && (
        <ConfirmDialog
          user={confirm.target}
          newRole={confirm.newRole}
          onConfirm={confirmRoleChange}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* Toast */}
      {toasting && (
        <div
          className="fixed bottom-6 left-1/2 z-50 px-5 py-3 rounded-xl text-[14px] font-medium text-white"
          style={{ transform: 'translateX(-50%)', background: '#10b981', boxShadow: '0 8px 24px rgba(16,185,129,0.35)' }}
        >
          {toasting}
        </div>
      )}

      <div>
        {/* Hero */}
        <section style={{ background: HERO_GRADIENT }} className="py-8">
          <div className="max-w-[1280px] mx-auto px-4 flex items-center justify-between gap-4">
            <div>
              <h1 className="font-medium text-[36px] text-white leading-10 tracking-[0.37px]">Kelola Pengguna</h1>
              <p className="mt-2 text-[16px] leading-6" style={{ color: 'rgba(255,255,255,0.9)' }}>
                Manajemen akun dan peran seluruh pengguna sistem
              </p>
            </div>
            {!loading && (
              <div className="shrink-0 flex gap-3">
                <div className="px-4 py-3 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <p className="text-[22px] font-semibold text-white leading-none">{totalCitizens}</p>
                  <p className="text-[11px] text-white/80 mt-0.5">Warga</p>
                </div>
                <div className="px-4 py-3 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <p className="text-[22px] font-semibold text-white leading-none">{totalAdmins}</p>
                  <p className="text-[11px] text-white/80 mt-0.5">Admin</p>
                </div>
              </div>
            )}
          </div>
        </section>

        <div className="max-w-[1280px] mx-auto px-4 pb-12 pt-8">

          {/* Toolbar */}
          <div className="mb-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <SearchIcon />
              </div>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari nama atau email..."
                className="w-full h-10 pl-9 pr-4 bg-white border border-[#e5e7eb] rounded-lg text-[14px] text-[#1a1a1a] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#1e40af] focus:border-transparent"
                style={CARD_SHADOW}
              />
            </div>
            <div className="flex items-center gap-1 bg-[#f3f4f6] rounded-lg p-1">
              {[
                { value: 'semua', label: 'Semua' },
                { value: 'citizen', label: 'Warga' },
                { value: 'admin', label: 'Admin' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setRoleFilter(opt.value)}
                  className="h-8 px-4 rounded-md text-[13px] font-medium transition-colors cursor-pointer border-0"
                  style={{
                    background: roleFilter === opt.value ? '#fff' : 'transparent',
                    color:      roleFilter === opt.value ? '#1a1a1a' : '#6b7280',
                    boxShadow:  roleFilter === opt.value ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-[#e5e7eb] rounded-lg overflow-hidden" style={CARD_SHADOW}>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
                    <th className="px-6 py-3 text-left text-[12px] font-medium text-[#6b7280] uppercase tracking-wide">Pengguna</th>
                    <th className="px-6 py-3 text-left text-[12px] font-medium text-[#6b7280] uppercase tracking-wide">Email</th>
                    <th className="px-6 py-3 text-left text-[12px] font-medium text-[#6b7280] uppercase tracking-wide">Peran</th>
                    <th className="px-6 py-3 text-left text-[12px] font-medium text-[#6b7280] uppercase tracking-wide">Tgl. Daftar</th>
                    <th className="px-6 py-3 text-left text-[12px] font-medium text-[#6b7280] uppercase tracking-wide">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <svg className="animate-spin w-6 h-6 text-[#1e40af] mx-auto" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="#e5e7eb" strokeWidth="3" />
                          <path d="M12 2a10 10 0 0 1 10 10" stroke="#1e40af" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-[14px] text-[#6b7280]">
                        Tidak ada pengguna yang cocok
                      </td>
                    </tr>
                  ) : (
                    filtered.map((u, i) => {
                      const roleCfg    = ROLE_CFG[u.role] ?? ROLE_CFG.citizen
                      const isSelf     = u.id === currentUser?.id
                      const initials   = avatarInitials(u.full_name)

                      return (
                        <tr key={u.id} className="border-b border-[#f3f4f6] hover:bg-[#fafafa] transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-[12px] font-semibold text-white"
                                style={{ background: u.role === 'admin' ? '#059669' : `hsl(${(i * 53) % 360}, 50%, 52%)` }}
                              >
                                {initials}
                              </div>
                              <div>
                                <p className="font-medium text-[#1a1a1a]">{u.full_name ?? '—'}</p>
                                {isSelf && (
                                  <p className="text-[11px] text-[#9ca3af]">Akun Anda</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-[#6b7280]">{u.email ?? '—'}</td>
                          <td className="px-6 py-4">
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-medium"
                              style={{ background: roleCfg.bg, color: roleCfg.color }}
                            >
                              {u.role === 'admin' ? <ShieldIcon /> : <UserIcon />}
                              {roleCfg.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-[#6b7280]">{formatDate(u.created_at)}</td>
                          <td className="px-6 py-4">
                            {isSelf ? (
                              <span className="text-[12px] text-[#c8d0da]">—</span>
                            ) : u.role === 'citizen' ? (
                              <button
                                onClick={() => requestRoleChange(u, 'admin')}
                                className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium cursor-pointer border-0 hover:opacity-90 transition-opacity"
                                style={{ background: 'rgba(16,185,129,0.1)', color: '#059669' }}
                              >
                                <ShieldIcon /> Jadikan Admin
                              </button>
                            ) : (
                              <button
                                onClick={() => requestRoleChange(u, 'citizen')}
                                className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium cursor-pointer border-0 hover:opacity-90 transition-opacity"
                                style={{ background: 'rgba(239,68,68,0.08)', color: '#dc2626' }}
                              >
                                <UserIcon /> Jadikan Warga
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {!loading && filtered.length > 0 && (
              <div className="px-6 py-3 border-t border-[#f3f4f6] text-[12px] text-[#9ca3af]">
                Menampilkan {filtered.length} pengguna
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
