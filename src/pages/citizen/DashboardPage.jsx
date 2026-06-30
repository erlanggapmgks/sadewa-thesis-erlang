import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../routes/routes'
import { useAuthContext } from '../../context/AuthContext'
import { supabase } from '../../services/supabase'
import { getMyRequests } from '../../services/documentService'
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

const DEMO_REQUESTS = [
  { id: 'demo-001', service_type: 'sktm',      status: 'completed', created_at: '2026-06-20T10:00:00Z' },
  { id: 'demo-002', service_type: 'domisili',  status: 'approved',  created_at: '2026-06-22T09:00:00Z' },
  { id: 'demo-003', service_type: 'pengantar', status: 'pending',   created_at: '2026-06-28T08:30:00Z' },
  { id: 'demo-004', service_type: 'usaha',     status: 'rejected',  created_at: '2026-06-15T14:00:00Z' },
]

// ── Icons ─────────────────────────────────────────────────────────────────────

function ClipboardIcon({ color = '#1e40af' }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.75" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

function CheckCircleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.75" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

function XCircleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.75" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.pending
  return (
    <span className="px-2.5 py-0.5 rounded-full text-[12px] font-medium leading-4 whitespace-nowrap shrink-0"
      style={{ background: s.bg, color: s.text }}>
      {s.label}
    </span>
  )
}

function RequestRow({ req, divider }) {
  return (
    <div className={divider ? 'mt-3' : ''}>
      <div className="border border-[#e5e7eb] rounded-lg p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium text-[14px] text-[#1a1a1a] leading-5 truncate">
              {SERVICE_TYPE_LABELS[req.service_type] ?? req.service_type}
            </p>
            <p className="text-[12px] text-[#6b7280] mt-0.5" style={{ fontFamily: 'Menlo, monospace' }}>
              REQ-{req.id.slice(-6).toUpperCase()}
            </p>
          </div>
          <StatusBadge status={req.status} />
        </div>
        <p className="mt-2 text-[12px] text-[#9ca3af]">{formatDate(req.created_at)}</p>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CitizenDashboard() {
  const { user } = useAuthContext()
  const [requests, setRequests] = useState([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    async function load() {
      if (!supabase || !user) {
        setRequests(DEMO_REQUESTS)
        setLoadingData(false)
        return
      }
      const data = await getMyRequests(user.id)
      setRequests(data)
      setLoadingData(false)
    }
    load()
  }, [user])

  const total     = requests.length
  const pending   = requests.filter(r => r.status === 'pending').length
  const completed = requests.filter(r => r.status === 'completed').length
  const rejected  = requests.filter(r => r.status === 'rejected').length

  const STATS = [
    { label: 'Total Permohonan', value: total,     iconBg: 'rgba(30,64,175,0.1)',  icon: <ClipboardIcon /> },
    { label: 'Sedang Diproses',  value: pending,   iconBg: 'rgba(245,158,11,0.1)', icon: <ClockIcon /> },
    { label: 'Selesai',          value: completed, iconBg: 'rgba(16,185,129,0.1)', icon: <CheckCircleIcon /> },
    { label: 'Ditolak',          value: rejected,  iconBg: 'rgba(239,68,68,0.1)',  icon: <XCircleIcon /> },
  ]

  const recent = requests.slice(0, 3)

  return (
    <div>
      {/* Hero */}
      <section style={{ background: HERO_GRADIENT }} className="py-8">
        <div className="max-w-[1280px] mx-auto px-4">
          <h1 className="font-medium text-[36px] text-white leading-10 tracking-[0.37px]">
            Selamat Datang, {user?.name ?? 'Warga'}
          </h1>
          <p className="mt-2 text-[16px] leading-6 tracking-[-0.31px]" style={{ color: 'rgba(255,255,255,0.9)' }}>
            Kelola permohonan administrasi dan pantau status pengajuan Anda
          </p>
        </div>
      </section>

      <div className="max-w-[1280px] mx-auto px-4">
        {/* Stat cards */}
        <div className="relative -mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map(s => (
            <div key={s.label} className="bg-white border border-[#e5e7eb] rounded-lg p-5 flex items-center justify-between" style={CARD_SHADOW}>
              <div>
                <p className="text-[13px] text-[#6b7280] leading-5">{s.label}</p>
                <p className="mt-1 font-semibold text-[28px] text-[#1a1a1a] leading-8">
                  {loadingData ? '–' : s.value}
                </p>
              </div>
              <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0" style={{ background: s.iconBg }}>
                {s.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Action cards */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to={ROUTES.CITIZEN_REQUEST}
            className="flex items-center gap-4 p-6 rounded-lg border border-[#e5e7eb] no-underline hover:opacity-90 transition-opacity"
            style={{ background: '#1e40af', ...CARD_SHADOW }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            <span className="font-medium text-[18px] text-white leading-7">Permohonan Baru</span>
          </Link>
          <Link
            to={ROUTES.CITIZEN_TRACK}
            className="flex items-center gap-4 p-6 rounded-lg border border-[#e5e7eb] no-underline hover:opacity-90 transition-opacity"
            style={{ background: '#3b82f6', ...CARD_SHADOW }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <span className="font-medium text-[18px] text-white leading-7">Lacak Permohonan</span>
          </Link>
        </div>

        {/* Recent requests */}
        <div className="mt-6 pb-12">
          <div className="bg-white border border-[#e5e7eb] rounded-lg" style={CARD_SHADOW}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#e5e7eb]">
              <h2 className="font-medium text-[18px] text-[#1a1a1a] leading-[18px] tracking-[-0.89px]">
                Permohonan Terbaru
              </h2>
              <Link
                to={ROUTES.CITIZEN_TRACK}
                className="h-8 px-3 flex items-center justify-center bg-white border border-[#e5e7eb] rounded-lg text-[13px] font-medium text-[#1a1a1a] no-underline hover:bg-[#f9fafb] transition-colors"
              >
                Lihat Semua
              </Link>
            </div>
            <div className="px-6 py-5">
              {loadingData ? (
                <p className="text-[14px] text-[#6b7280] text-center py-6">Memuat...</p>
              ) : recent.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-[14px] text-[#6b7280]">Belum ada permohonan.</p>
                  <Link to={ROUTES.CITIZEN_REQUEST} className="mt-3 inline-block text-[14px] font-medium text-[#1e40af] no-underline hover:underline">
                    Ajukan sekarang →
                  </Link>
                </div>
              ) : (
                recent.map((req, i) => <RequestRow key={req.id} req={req} divider={i > 0} />)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
