import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../services/supabase'
import { getAllProfiles } from '../../services/authService'
import { getAllRequests } from '../../services/documentService'
import { formatDate } from '../../utils/formatDate'

// ── Constants ─────────────────────────────────────────────────────────────────

const HERO_GRADIENT = 'linear-gradient(90deg, #1e40af 0%, #10b981 100%)'
const CARD_SHADOW   = { boxShadow: '0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)' }

const DEMO_CITIZENS = [
  { id: 'c1', full_name: 'Daniel Abraham',   email: 'daniel@example.com',   nik: '3401012345678901', created_at: '2026-06-01T08:00:00Z', role: 'citizen' },
  { id: 'c2', full_name: 'Siti Rahayu',      email: 'siti@example.com',     nik: '3401019876543210', created_at: '2026-06-05T09:00:00Z', role: 'citizen' },
  { id: 'c3', full_name: 'Budi Kurniawan',   email: 'budi@example.com',     nik: '3401011122334455', created_at: '2026-06-08T10:00:00Z', role: 'citizen' },
  { id: 'c4', full_name: 'Maya Lestari',     email: 'maya@example.com',     nik: '3401015566778899', created_at: '2026-06-10T11:00:00Z', role: 'citizen' },
  { id: 'c5', full_name: 'Ahmad Fauzi',      email: 'ahmad@example.com',    nik: '3401019988776655', created_at: '2026-06-12T08:30:00Z', role: 'citizen' },
  { id: 'c6', full_name: 'Rina Susanti',     email: 'rina@example.com',     nik: '3401014433221100', created_at: '2026-06-15T14:00:00Z', role: 'citizen' },
  { id: 'c7', full_name: 'Hendra Wijaya',    email: 'hendra@example.com',   nik: '3401017788990011', created_at: '2026-06-18T09:00:00Z', role: 'citizen' },
  { id: 'c8', full_name: 'Sri Mulyani',      email: 'sri@example.com',      nik: '3401010099887766', created_at: '2026-06-20T13:00:00Z', role: 'citizen' },
]

const DEMO_REQ_COUNTS = { c1: 2, c2: 1, c3: 1, c4: 1, c5: 1, c6: 1, c7: 1, c8: 1 }

// ── Icons ─────────────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1e40af" strokeWidth="1.75">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CitizensPage() {
  const [citizens, setCitizens]   = useState([])
  const [reqCounts, setReqCounts] = useState({})
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')

  useEffect(() => {
    async function load() {
      if (!supabase) {
        setCitizens(DEMO_CITIZENS)
        setReqCounts(DEMO_REQ_COUNTS)
        setLoading(false)
        return
      }
      const [profiles, requests] = await Promise.all([
        getAllProfiles('citizen'),
        getAllRequests(),
      ])
      setCitizens(profiles)
      // Count requests per citizen
      const counts = {}
      requests.forEach(r => { counts[r.user_id] = (counts[r.user_id] ?? 0) + 1 })
      setReqCounts(counts)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return citizens
    return citizens.filter(c =>
      c.full_name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.nik?.includes(q)
    )
  }, [citizens, search])

  function avatarInitials(name) {
    return (name ?? 'W').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  }

  function maskNik(nik) {
    if (!nik || nik.length < 8) return nik ?? '—'
    return nik.slice(0, 6) + '**' + nik.slice(8, 12) + '****'
  }

  return (
    <div>
      {/* Hero */}
      <section style={{ background: HERO_GRADIENT }} className="py-8">
        <div className="max-w-[1280px] mx-auto px-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-medium text-[36px] text-white leading-10 tracking-[0.37px]">Data Warga</h1>
            <p className="mt-2 text-[16px] leading-6" style={{ color: 'rgba(255,255,255,0.9)' }}>
              Direktori seluruh warga yang terdaftar di sistem SADEWA
            </p>
          </div>
          {!loading && (
            <div
              className="shrink-0 px-5 py-3 rounded-lg text-white"
              style={{ background: 'rgba(255,255,255,0.15)' }}
            >
              <p className="text-[28px] font-semibold leading-none">{citizens.length}</p>
              <p className="text-[12px] mt-0.5 opacity-90">Warga Terdaftar</p>
            </div>
          )}
        </div>
      </section>

      <div className="max-w-[1280px] mx-auto px-4 pb-12 pt-8">

        {/* Search */}
        <div className="mb-6 relative max-w-sm">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <SearchIcon />
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama, email, atau NIK..."
            className="w-full h-10 pl-9 pr-4 bg-white border border-[#e5e7eb] rounded-lg text-[14px] text-[#1a1a1a] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#1e40af] focus:border-transparent"
            style={CARD_SHADOW}
          />
        </div>

        {/* Table */}
        <div className="bg-white border border-[#e5e7eb] rounded-lg overflow-hidden" style={CARD_SHADOW}>
          <div className="px-6 py-4 border-b border-[#e5e7eb] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UsersIcon />
              <h2 className="font-medium text-[16px] text-[#1a1a1a]">Daftar Warga</h2>
            </div>
            {search && (
              <p className="text-[13px] text-[#6b7280]">
                {filtered.length} dari {citizens.length} hasil
              </p>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
                  <th className="px-6 py-3 text-left text-[12px] font-medium text-[#6b7280] uppercase tracking-wide">Warga</th>
                  <th className="px-6 py-3 text-left text-[12px] font-medium text-[#6b7280] uppercase tracking-wide">NIK</th>
                  <th className="px-6 py-3 text-left text-[12px] font-medium text-[#6b7280] uppercase tracking-wide">Email</th>
                  <th className="px-6 py-3 text-left text-[12px] font-medium text-[#6b7280] uppercase tracking-wide">Tgl. Daftar</th>
                  <th className="px-6 py-3 text-center text-[12px] font-medium text-[#6b7280] uppercase tracking-wide">Permohonan</th>
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
                      {search ? `Tidak ada warga yang cocok dengan "${search}"` : 'Belum ada warga terdaftar'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((c, i) => {
                    const initials = avatarInitials(c.full_name)
                    const count    = reqCounts[c.id] ?? 0
                    return (
                      <tr key={c.id} className="border-b border-[#f3f4f6] hover:bg-[#fafafa] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-[13px] font-semibold text-white"
                              style={{ background: `hsl(${(i * 47) % 360}, 55%, 55%)` }}
                            >
                              {initials}
                            </div>
                            <span className="font-medium text-[#1a1a1a]">{c.full_name ?? '—'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[#6b7280]" style={{ fontFamily: 'Menlo, monospace', fontSize: '11px' }}>
                          {maskNik(c.nik)}
                        </td>
                        <td className="px-6 py-4 text-[#6b7280]">{c.email ?? '—'}</td>
                        <td className="px-6 py-4 text-[#6b7280]">{formatDate(c.created_at)}</td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className="inline-block px-2.5 py-0.5 rounded-full text-[12px] font-medium"
                            style={{
                              background: count > 0 ? 'rgba(30,64,175,0.08)' : '#f3f4f6',
                              color:      count > 0 ? '#1e40af' : '#9ca3af',
                            }}
                          >
                            {count}
                          </span>
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
              Menampilkan {filtered.length} warga
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
