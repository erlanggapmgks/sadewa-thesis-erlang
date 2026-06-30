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

const DEMO_REQUESTS = [
  {
    id: 'demo-req-001', service_type: 'sktm', status: 'pending', created_at: '2026-06-28T08:30:00Z',
    profiles: { full_name: 'Daniel Abraham' },
  },
  {
    id: 'demo-req-002', service_type: 'domisili', status: 'pending', created_at: '2026-06-27T14:00:00Z',
    profiles: { full_name: 'Siti Rahayu' },
  },
  {
    id: 'demo-req-003', service_type: 'usaha', status: 'approved', created_at: '2026-06-27T09:00:00Z',
    profiles: { full_name: 'Budi Kurniawan' },
  },
  {
    id: 'demo-req-004', service_type: 'pengantar', status: 'completed', created_at: '2026-06-26T11:00:00Z',
    profiles: { full_name: 'Maya Lestari' },
  },
  {
    id: 'demo-req-005', service_type: 'sktm', status: 'rejected', created_at: '2026-06-25T16:30:00Z',
    profiles: { full_name: 'Ahmad Fauzi' },
  },
  {
    id: 'demo-req-006', service_type: 'domisili', status: 'pending', created_at: '2026-06-24T10:00:00Z',
    profiles: { full_name: 'Rina Susanti' },
  },
]

const STATUS_QUEUE_MAP = {
  pending:  { bg: 'rgba(59,130,246,0.1)',  text: '#3b82f6', label: 'Menunggu' },
  approved: { bg: 'rgba(245,158,11,0.1)',  text: '#f59e0b', label: 'Disetujui' },
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function ClockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.75">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

function CheckCircleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.75">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

function ChartBarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1e40af" strokeWidth="1.75">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  )
}

function DocumentIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.75">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
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

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [requests, setRequests]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('semua')

  useEffect(() => {
    async function load() {
      if (!supabase) { setRequests(DEMO_REQUESTS); setLoading(false); return }
      const data = await getAllRequests()
      setRequests(data)
      setLoading(false)
    }
    load()
  }, [])

  // Stats
  const pending   = requests.filter(r => r.status === 'pending').length
  const approved  = requests.filter(r => r.status === 'approved').length
  const today     = new Date().toDateString()
  const doneToday = requests.filter(r =>
    r.status === 'completed' && new Date(r.created_at).toDateString() === today
  ).length
  const total = requests.length

  const STATS = [
    { label: 'Menunggu Tinjauan', value: pending,   iconBg: 'rgba(245,158,11,0.1)', icon: <ClockIcon /> },
    { label: 'Sedang Diproses',   value: approved,  iconBg: 'rgba(59,130,246,0.1)',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.75"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg> },
    { label: 'Selesai Hari Ini',  value: doneToday, iconBg: 'rgba(16,185,129,0.1)', icon: <CheckCircleIcon /> },
    { label: 'Total Permohonan',  value: total,     iconBg: 'rgba(30,64,175,0.1)',  icon: <ChartBarIcon /> },
  ]

  // Queue: pending + approved, most recent first
  const queue = requests
    .filter(r => r.status === 'pending' || r.status === 'approved')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  const FILTER_OPTIONS = [
    { value: 'semua',    label: 'Semua' },
    { value: 'pending',  label: 'Menunggu' },
    { value: 'approved', label: 'Disetujui' },
  ]

  const filtered = filter === 'semua' ? queue : queue.filter(r => r.status === filter)

  return (
    <div>
      <section style={{ background: HERO_GRADIENT }} className="py-8">
        <div className="max-w-[1280px] mx-auto px-4">
          <h1 className="font-medium text-[36px] text-white leading-10 tracking-[0.37px]">Dashboard Admin</h1>
          <p className="mt-2 text-[16px] leading-6 tracking-[-0.31px]" style={{ color: 'rgba(255,255,255,0.9)' }}>
            Tinjau dan proses permohonan warga
          </p>
        </div>
      </section>

      <div className="max-w-[1280px] mx-auto px-4 pb-12">
        {/* Stat cards */}
        <div className="relative -mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map(s => (
            <div key={s.label} className="bg-white border border-[#e5e7eb] rounded-lg p-5 flex items-center justify-between" style={CARD_SHADOW}>
              <div>
                <p className="text-[13px] text-[#6b7280] leading-5">{s.label}</p>
                <p className="mt-1 font-semibold text-[28px] text-[#1a1a1a] leading-8">
                  {loading ? '–' : s.value}
                </p>
              </div>
              <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0" style={{ background: s.iconBg }}>
                {s.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Queue card */}
        <div className="mt-8 bg-white border border-[#e5e7eb] rounded-lg" style={CARD_SHADOW}>
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#e5e7eb]">
            <h2 className="font-medium text-[18px] text-[#1a1a1a] tracking-[-0.89px]">Antrean Permohonan</h2>
            <div className="flex items-center gap-1 bg-[#f3f4f6] rounded-lg p-1">
              {FILTER_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFilter(opt.value)}
                  className="h-7 px-3 rounded-md text-[13px] font-medium transition-colors cursor-pointer border-0"
                  style={{
                    background: filter === opt.value ? '#fff' : 'transparent',
                    color: filter === opt.value ? '#1a1a1a' : '#6b7280',
                    boxShadow: filter === opt.value ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="px-6 py-5 flex flex-col gap-4">
            {loading ? (
              <div className="py-8 flex justify-center">
                <svg className="animate-spin w-6 h-6 text-[#1e40af]" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#e5e7eb" strokeWidth="3" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="#1e40af" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-8 text-center text-[14px] text-[#6b7280]">
                Tidak ada permohonan dalam antrean
              </p>
            ) : (
              filtered.map((req, i) => {
                const s = STATUS_QUEUE_MAP[req.status] ?? STATUS_QUEUE_MAP.pending
                return (
                  <div key={req.id} className={i > 0 ? 'border-t border-[#f3f4f6] pt-4' : ''}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: 'rgba(30,64,175,0.08)' }}>
                          <DocumentIcon />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-[14px] text-[#1a1a1a] leading-5 truncate">
                            {SERVICE_TYPE_LABELS[req.service_type] ?? req.service_type}
                          </p>
                          <p className="text-[12px] text-[#6b7280] mt-0.5">
                            <span style={{ fontFamily: 'Menlo, monospace' }}>REQ-{req.id.slice(-6).toUpperCase()}</span>
                            {' · '}{req.profiles?.full_name ?? '—'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <p className="text-[13px] text-[#6b7280] hidden sm:block">{formatDate(req.created_at)}</p>
                        <span className="px-2.5 py-0.5 rounded-full text-[12px] font-medium"
                          style={{ background: s.bg, color: s.text }}>
                          {s.label}
                        </span>
                        <button
                          onClick={() => navigate(ROUTES.ADMIN_REQUEST_DETAIL.replace(':id', req.id))}
                          className="flex items-center gap-1.5 h-8 px-3 bg-[#1e40af] rounded-lg text-[13px] font-medium text-white hover:bg-[#1e3a8a] transition-colors border-0 cursor-pointer"
                        >
                          Proses <ArrowRightIcon />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
