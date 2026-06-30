import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../routes/routes'
import { supabase } from '../../services/supabase'
import { getAllRequests } from '../../services/documentService'
import { formatDate } from '../../utils/formatDate'
import { SERVICE_TYPE_LABELS } from '../../utils/constants'

// ── Constants ─────────────────────────────────────────────────────────────────

const HERO_GRADIENT = 'linear-gradient(90deg, #1e40af 0%, #10b981 100%)'
const CARD_SHADOW = { boxShadow: '0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)' }

const STATUS_MAP = {
  pending:   { bg: 'rgba(59,130,246,0.1)',  text: '#3b82f6', label: 'Menunggu Tinjauan' },
  approved:  { bg: 'rgba(245,158,11,0.1)',  text: '#f59e0b', label: 'Disetujui' },
  rejected:  { bg: 'rgba(239,68,68,0.1)',   text: '#ef4444', label: 'Ditolak' },
  completed: { bg: 'rgba(16,185,129,0.1)',  text: '#10b981', label: 'Selesai' },
}

const AI_STATUS_MAP = {
  success: { bg: 'rgba(16,185,129,0.1)',  text: '#059669', label: 'Berhasil' },
  warning: { bg: 'rgba(245,158,11,0.1)',  text: '#d97706', label: 'Peringatan' },
  error:   { bg: 'rgba(239,68,68,0.1)',   text: '#dc2626', label: 'Gagal' },
}

const FILTER_OPTIONS = [
  { value: 'semua',     label: 'Semua Status' },
  { value: 'pending',   label: 'Menunggu Tinjauan' },
  { value: 'approved',  label: 'Disetujui' },
  { value: 'rejected',  label: 'Ditolak' },
  { value: 'completed', label: 'Selesai' },
]

const DEMO_REQUESTS = [
  {
    id: 'demo-req-001', service_type: 'sktm', status: 'pending', created_at: '2026-06-28T08:30:00Z',
    ai_reading_status: 'success', document_quality_status: 'good', completeness_status: 'complete',
    profiles: { full_name: 'Daniel Abraham', nik: '3401012345678901' },
  },
  {
    id: 'demo-req-002', service_type: 'domisili', status: 'approved', created_at: '2026-06-27T14:00:00Z',
    ai_reading_status: 'success', document_quality_status: 'good', completeness_status: 'complete',
    profiles: { full_name: 'Siti Rahayu', nik: '3401098765432101' },
  },
  {
    id: 'demo-req-003', service_type: 'usaha', status: 'pending', created_at: '2026-06-27T09:00:00Z',
    ai_reading_status: 'warning', document_quality_status: 'blurred', completeness_status: 'incomplete',
    profiles: { full_name: 'Budi Kurniawan', nik: '3401011112222301' },
  },
  {
    id: 'demo-req-004', service_type: 'pengantar', status: 'completed', created_at: '2026-06-26T11:00:00Z',
    ai_reading_status: 'success', document_quality_status: 'good', completeness_status: 'complete',
    profiles: { full_name: 'Maya Lestari', nik: '3401055566677801' },
  },
  {
    id: 'demo-req-005', service_type: 'sktm', status: 'rejected', created_at: '2026-06-25T16:30:00Z',
    ai_reading_status: 'error', document_quality_status: 'invalid', completeness_status: 'incomplete',
    profiles: { full_name: 'Ahmad Fauzi', nik: '3401099988877601' },
  },
]

// ── Icons ─────────────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.75">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ManageRequestsPage() {
  const navigate = useNavigate()
  const [requests, setRequests]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState('semua')

  useEffect(() => {
    async function load() {
      if (!supabase) { setRequests(DEMO_REQUESTS); setLoading(false); return }
      const data = await getAllRequests()
      setRequests(data)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = requests.filter(r => {
    const q = search.toLowerCase()
    const name = (r.profiles?.full_name ?? '').toLowerCase()
    const label = (SERVICE_TYPE_LABELS[r.service_type] ?? '').toLowerCase()
    const matchSearch = q === '' || r.id.toLowerCase().includes(q) || name.includes(q) || label.includes(q)
    const matchStatus = statusFilter === 'semua' || r.status === statusFilter
    return matchSearch && matchStatus
  })

  const pendingCount = requests.filter(r => r.status === 'pending').length

  return (
    <div>
      <section style={{ background: HERO_GRADIENT }} className="py-8">
        <div className="max-w-[1280px] mx-auto px-4">
          <h1 className="font-medium text-[36px] text-white leading-10 tracking-[0.37px]">Kelola Pengajuan</h1>
          <p className="mt-2 text-[16px] leading-6 tracking-[-0.31px]" style={{ color: 'rgba(255,255,255,0.9)' }}>
            {pendingCount > 0
              ? `${pendingCount} permohonan menunggu tinjauan Anda`
              : 'Tidak ada permohonan yang menunggu'}
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
                placeholder="Cari nama warga, ID permohonan, atau jenis layanan..."
                className="w-full h-[42px] bg-white border border-[#e5e7eb] rounded-lg pl-[38px] pr-4 text-[14px] text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#1e40af] focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="h-[42px] bg-white border border-[#e5e7eb] rounded-lg px-3 text-[14px] text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#1e40af] cursor-pointer shrink-0"
            >
              {FILTER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="mt-6 bg-white border border-[#e5e7eb] rounded-lg overflow-hidden" style={CARD_SHADOW}>
          <div className="px-6 py-5 border-b border-[#e5e7eb] flex items-center justify-between">
            <h2 className="font-medium text-[18px] text-[#1a1a1a] tracking-[-0.89px]">
              Daftar Permohonan
            </h2>
            <span className="text-[13px] text-[#6b7280]">{filtered.length} permohonan</span>
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
                    {['No. Permohonan', 'Warga', 'Layanan', 'Tanggal', 'AI', 'Status', 'Aksi'].map(col => (
                      <th key={col} className="px-4 py-3 text-left text-[13px] font-medium text-[#6b7280] whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-14 text-center text-[14px] text-[#6b7280]">
                        Tidak ada permohonan ditemukan
                      </td>
                    </tr>
                  ) : filtered.map(req => {
                    const status = STATUS_MAP[req.status] ?? STATUS_MAP.pending
                    const ai     = AI_STATUS_MAP[req.ai_reading_status] ?? AI_STATUS_MAP.success
                    return (
                      <tr key={req.id} className="border-b border-[#e5e7eb] last:border-0 hover:bg-[#fafafa] transition-colors">
                        <td className="px-4 py-4 text-[12px] text-[#6b7280] whitespace-nowrap" style={{ fontFamily: 'Menlo, monospace' }}>
                          REQ-{req.id.slice(-6).toUpperCase()}
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-[13px] font-medium text-[#1a1a1a]">{req.profiles?.full_name ?? '—'}</p>
                          <p className="text-[11px] text-[#9ca3af] mt-0.5" style={{ fontFamily: 'Menlo, monospace' }}>
                            {req.profiles?.nik ?? '—'}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-[13px] text-[#1a1a1a] max-w-[200px]">
                          {SERVICE_TYPE_LABELS[req.service_type] ?? req.service_type}
                        </td>
                        <td className="px-4 py-4 text-[13px] text-[#6b7280] whitespace-nowrap">
                          {formatDate(req.created_at)}
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
                            style={{ background: ai.bg, color: ai.text }}>
                            AI: {ai.label}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium"
                            style={{ background: status.bg, color: status.text }}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() => navigate(ROUTES.ADMIN_REQUEST_DETAIL.replace(':id', req.id))}
                            className="flex items-center gap-1.5 h-8 px-3 bg-[#1e40af] rounded-lg text-[12px] font-medium text-white hover:bg-[#1e3a8a] transition-colors border-0 cursor-pointer whitespace-nowrap"
                          >
                            Tinjau <ArrowRightIcon />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
