import { useState, useEffect } from 'react'
import { useAuthContext } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { getMyRequests } from '../../services/documentService'
import { formatDate } from '../../utils/formatDate'
import { SERVICE_TYPE_LABELS } from '../../utils/constants'
import { ROUTES } from '../../routes/routes'

// ── Constants ─────────────────────────────────────────────────────────────────

const HERO_GRADIENT = 'linear-gradient(90deg, #1e40af 0%, #10b981 100%)'
const CARD_SHADOW = { boxShadow: '0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)' }

const STATUS_MAP = {
  pending:      { bg: 'rgba(59,130,246,0.1)',  text: '#3b82f6', label: 'Menunggu Tinjauan',     bar: '#3b82f6', progress: 25  },
  kades_review: { bg: 'rgba(124,58,237,0.1)', text: '#7c3aed', label: 'Proses Penandatanganan', bar: '#7c3aed', progress: 60  },
  signed:       { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b', label: 'Sedang Diproses Admin',  bar: '#f59e0b', progress: 80  },
  approved:     { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b', label: 'Disetujui',              bar: '#f59e0b', progress: 80  },
  rejected:     { bg: 'rgba(239,68,68,0.1)',  text: '#ef4444', label: 'Ditolak',                bar: '#ef4444', progress: 100 },
  completed:    { bg: 'rgba(16,185,129,0.1)', text: '#10b981', label: 'Surat Tersedia',         bar: '#10b981', progress: 100 },
}

const FILTER_OPTIONS = [
  { value: 'semua',        label: 'Semua Status' },
  { value: 'pending',      label: 'Menunggu Tinjauan' },
  { value: 'kades_review', label: 'Proses Penandatanganan' },
  { value: 'signed',       label: 'Sedang Diproses Admin' },
  { value: 'rejected',     label: 'Ditolak' },
  { value: 'completed',    label: 'Surat Tersedia' },
]

const DEMO_REQUESTS = [
  { id: 'demo-001', service_type: 'sktm',      status: 'completed', created_at: '2026-06-20T10:00:00Z' },
  { id: 'demo-002', service_type: 'domisili',  status: 'approved',  created_at: '2026-06-22T09:00:00Z' },
  { id: 'demo-003', service_type: 'pengantar', status: 'pending',   created_at: '2026-06-28T08:30:00Z' },
  { id: 'demo-004', service_type: 'usaha',     status: 'rejected',  created_at: '2026-06-15T14:00:00Z' },
]

// ── Icons ─────────────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.75" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  )
}

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.75" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.pending
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium leading-4 whitespace-nowrap"
      style={{ background: s.bg, color: s.text }}>
      {s.label}
    </span>
  )
}

function ProgressBar({ status }) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.pending
  return (
    <div className="flex items-center gap-2">
      <div className="w-[42px] h-2 bg-[#f3f4f6] rounded-full overflow-hidden shrink-0">
        <div className="h-full rounded-full transition-all" style={{ width: `${s.progress}%`, background: s.bar }} />
      </div>
      <span className="text-[12px] text-[#6b7280] leading-4 w-9 shrink-0">{s.progress}%</span>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function TrackRequestPage() {
  const { user } = useAuthContext()
  const navigate = useNavigate()
  const [requests, setRequests]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState('semua')

  useEffect(() => {
    async function load() {
      if (!supabase || !user) {
        const stored = JSON.parse(sessionStorage.getItem('sadewa_demo_requests') ?? '[]')
        setRequests([...stored, ...DEMO_REQUESTS])
        setLoading(false)
        return
      }
      const data = await getMyRequests(user.id)
      setRequests(data)
      setLoading(false)
    }
    load()
  }, [user])

  const filtered = requests.filter(r => {
    const q = search.toLowerCase()
    const label = (SERVICE_TYPE_LABELS[r.service_type] ?? r.service_type).toLowerCase()
    const matchSearch = q === '' || r.id.toLowerCase().includes(q) || label.includes(q)
    const matchStatus = statusFilter === 'semua' || r.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div>
      <section style={{ background: HERO_GRADIENT }} className="py-8">
        <div className="max-w-[1280px] mx-auto px-4">
          <h1 className="font-medium text-[36px] text-white leading-10 tracking-[0.37px]">Lacak Permohonan</h1>
          <p className="mt-2 text-[16px] leading-6 tracking-[-0.31px]" style={{ color: 'rgba(255,255,255,0.9)' }}>
            Pantau status semua permohonan yang telah Anda ajukan
          </p>
        </div>
      </section>

      <div className="max-w-[1280px] mx-auto px-4 pb-12">
        {/* Search + filter */}
        <div className="relative -mt-4 bg-white border border-[#e5e7eb] rounded-lg p-4" style={CARD_SHADOW}>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"><SearchIcon /></div>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari berdasarkan ID atau nama layanan..."
                className="w-full h-[42px] bg-white border border-[#e5e7eb] rounded-lg pl-[41px] pr-4 text-[14px] text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#1e40af] focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <FilterIcon />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="h-[42px] bg-white border border-[#e5e7eb] rounded-lg px-3 text-[14px] text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#1e40af] cursor-pointer"
              >
                {FILTER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="mt-6 bg-white border border-[#e5e7eb] rounded-lg overflow-hidden" style={CARD_SHADOW}>
          <div className="px-6 py-5 border-b border-[#e5e7eb]">
            <h2 className="font-medium text-[18px] text-[#1a1a1a] leading-[18px] tracking-[-0.89px]">
              Riwayat Permohonan
            </h2>
          </div>

          {loading ? (
            <div className="py-16 flex justify-center">
              <svg className="animate-spin w-6 h-6 text-[#1e40af]" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#e5e7eb" strokeWidth="3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="#1e40af" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e5e7eb]">
                    {['No. Permohonan', 'Layanan', 'Tanggal Ajuan', 'Status', 'Progres', 'Aksi'].map(col => (
                      <th key={col} className="px-4 py-3 text-left text-[13px] font-medium text-[#6b7280] whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-14 text-center text-[14px] text-[#6b7280]">
                        Tidak ada permohonan yang ditemukan
                      </td>
                    </tr>
                  ) : filtered.map(req => (
                    <tr key={req.id} className="border-b border-[#e5e7eb] last:border-0 hover:bg-[#fafafa] transition-colors">
                      <td className="px-4 py-4 text-[13px] text-[#1a1a1a] whitespace-nowrap" style={{ fontFamily: 'Menlo, monospace' }}>
                        REQ-{req.id.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-4 py-4 text-[13px] text-[#1a1a1a]">
                        {SERVICE_TYPE_LABELS[req.service_type] ?? req.service_type}
                      </td>
                      <td className="px-4 py-4 text-[13px] text-[#6b7280] whitespace-nowrap">
                        {formatDate(req.created_at)}
                      </td>
                      <td className="px-4 py-4"><StatusBadge status={req.status} /></td>
                      <td className="px-4 py-4"><ProgressBar status={req.status} /></td>
                      <td className="px-4 py-4">
                        {req.status === 'completed' && (
                          <button
                            type="button"
                            onClick={() => navigate(ROUTES.CITIZEN_LETTER_VIEW.replace(':id', req.id))}
                            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium text-white hover:opacity-90 transition-opacity cursor-pointer border-0 whitespace-nowrap"
                            style={{ background: '#10b981' }}
                          >
                            <DownloadIcon />
                            Lihat Surat
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
