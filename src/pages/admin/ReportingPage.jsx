import { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'
import { getAllRequests } from '../../services/documentService'
import { SERVICE_TYPE_LABELS } from '../../utils/constants'
import { formatDate } from '../../utils/formatDate'

// ── Constants ─────────────────────────────────────────────────────────────────

const HERO_GRADIENT = 'linear-gradient(90deg, #1e40af 0%, #10b981 100%)'
const CARD_SHADOW = { boxShadow: '0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)' }

const STATUS_CFG = {
  pending:   { label: 'Menunggu',  color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  approved:  { label: 'Disetujui', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  rejected:  { label: 'Ditolak',   color: '#ef4444', bg: 'rgba(239,68,68,0.1)'  },
  completed: { label: 'Selesai',   color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
}

const DEMO_REQUESTS = [
  { id: 'r01', service_type: 'sktm',     status: 'pending',   created_at: '2026-06-28T08:30:00Z', profiles: { full_name: 'Daniel Abraham' } },
  { id: 'r02', service_type: 'domisili',  status: 'completed', created_at: '2026-06-27T14:00:00Z', profiles: { full_name: 'Siti Rahayu' } },
  { id: 'r03', service_type: 'usaha',     status: 'approved',  created_at: '2026-06-27T09:00:00Z', profiles: { full_name: 'Budi Kurniawan' } },
  { id: 'r04', service_type: 'pengantar', status: 'completed', created_at: '2026-06-26T11:00:00Z', profiles: { full_name: 'Maya Lestari' } },
  { id: 'r05', service_type: 'sktm',     status: 'rejected',  created_at: '2026-06-25T16:30:00Z', profiles: { full_name: 'Ahmad Fauzi' } },
  { id: 'r06', service_type: 'domisili',  status: 'pending',   created_at: '2026-06-24T10:00:00Z', profiles: { full_name: 'Rina Susanti' } },
  { id: 'r07', service_type: 'kelahiran', status: 'completed', created_at: '2026-06-23T09:00:00Z', profiles: { full_name: 'Hendra Wijaya' } },
  { id: 'r08', service_type: 'kematian',  status: 'completed', created_at: '2026-06-22T13:00:00Z', profiles: { full_name: 'Sri Mulyani' } },
  { id: 'r09', service_type: 'domisili',  status: 'approved',  created_at: '2026-06-21T10:30:00Z', profiles: { full_name: 'Bambang Priyatno' } },
  { id: 'r10', service_type: 'sktm',     status: 'completed', created_at: '2026-06-20T08:00:00Z', profiles: { full_name: 'Wati Purnamasari' } },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function shortLabel(full) {
  return full.replace('Surat Keterangan ', 'S.K. ').replace('Surat ', '')
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ReportingPage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      if (!supabase) { setRequests(DEMO_REQUESTS); setLoading(false); return }
      const data = await getAllRequests()
      setRequests(data)
      setLoading(false)
    }
    load()
  }, [])

  const total     = requests.length
  const pending   = requests.filter(r => r.status === 'pending').length
  const done      = requests.filter(r => r.status === 'completed').length
  const rejected  = requests.filter(r => r.status === 'rejected').length
  const approved  = requests.filter(r => r.status === 'approved').length

  const STATS = [
    { label: 'Total Permohonan', value: total,   color: '#1e40af', bg: 'rgba(30,64,175,0.1)' },
    { label: 'Selesai',          value: done,    color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Menunggu',         value: pending, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    { label: 'Ditolak',          value: rejected,color: '#ef4444', bg: 'rgba(239,68,68,0.1)'  },
  ]

  const byType = Object.keys(SERVICE_TYPE_LABELS)
    .map(type => ({ type, label: SERVICE_TYPE_LABELS[type], count: requests.filter(r => r.service_type === type).length }))
    .filter(x => x.count > 0)
    .sort((a, b) => b.count - a.count)

  const byStatus = Object.entries(STATUS_CFG)
    .map(([status, cfg]) => ({ status, ...cfg, count: requests.filter(r => r.status === status).length }))
    .filter(x => x.count > 0)

  const maxType   = Math.max(...byType.map(x => x.count), 1)
  const maxStatus = Math.max(...byStatus.map(x => x.count), 1)

  const recent = [...requests]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10)

  return (
    <div>
      {/* Hero */}
      <section style={{ background: HERO_GRADIENT }} className="py-8">
        <div className="max-w-[1280px] mx-auto px-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-medium text-[36px] text-white leading-10 tracking-[0.37px]">Laporan & Statistik</h1>
            <p className="mt-2 text-[16px] leading-6" style={{ color: 'rgba(255,255,255,0.9)' }}>
              Ringkasan aktivitas permohonan layanan administrasi Desa Wates
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 h-10 px-5 rounded-lg text-[14px] font-semibold bg-white cursor-pointer border-0 hover:opacity-90 transition-opacity shrink-0"
            style={{ color: '#1e40af' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e40af" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
            </svg>
            Cetak Laporan
          </button>
        </div>
      </section>

      <div className="max-w-[1280px] mx-auto px-4 pb-12">

        {/* Stat cards */}
        <div className="relative -mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map(s => (
            <div key={s.label} className="bg-white border border-[#e5e7eb] rounded-lg p-5" style={CARD_SHADOW}>
              <p className="text-[13px] text-[#6b7280]">{s.label}</p>
              <p className="mt-1 font-semibold text-[32px] leading-9" style={{ color: s.color }}>
                {loading ? '–' : s.value}
              </p>
              <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: s.bg }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ background: s.color, width: total ? `${(s.value / total) * 100}%` : '0%' }}
                />
              </div>
              <p className="mt-1 text-[11px]" style={{ color: s.color }}>
                {total ? `${Math.round((s.value / total) * 100)}%` : '0%'} dari total
              </p>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* By service type */}
          <div className="bg-white border border-[#e5e7eb] rounded-lg" style={CARD_SHADOW}>
            <div className="px-6 py-5 border-b border-[#e5e7eb]">
              <h2 className="font-medium text-[16px] text-[#1a1a1a] tracking-[-0.5px]">Distribusi per Jenis Layanan</h2>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4">
              {loading ? (
                <p className="py-6 text-center text-[14px] text-[#6b7280]">Memuat...</p>
              ) : byType.length === 0 ? (
                <p className="py-6 text-center text-[14px] text-[#6b7280]">Belum ada data</p>
              ) : byType.map(x => (
                <div key={x.type} className="flex items-center gap-3">
                  <div className="w-[120px] text-[12px] text-[#6b7280] text-right shrink-0 leading-4">{shortLabel(x.label)}</div>
                  <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: '#f3f4f6' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(x.count / maxType) * 100}%`, background: 'linear-gradient(90deg, #1e40af 0%, #3b82f6 100%)', transition: 'width 0.6s ease' }}
                    />
                  </div>
                  <div className="w-12 text-right shrink-0">
                    <span className="text-[13px] font-semibold text-[#1a1a1a]">{x.count}</span>
                    <span className="text-[11px] text-[#9ca3af] ml-1">({total ? Math.round((x.count/total)*100) : 0}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* By status */}
          <div className="bg-white border border-[#e5e7eb] rounded-lg" style={CARD_SHADOW}>
            <div className="px-6 py-5 border-b border-[#e5e7eb]">
              <h2 className="font-medium text-[16px] text-[#1a1a1a] tracking-[-0.5px]">Distribusi per Status</h2>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4">
              {loading ? (
                <p className="py-6 text-center text-[14px] text-[#6b7280]">Memuat...</p>
              ) : byStatus.length === 0 ? (
                <p className="py-6 text-center text-[14px] text-[#6b7280]">Belum ada data</p>
              ) : byStatus.map(x => (
                <div key={x.status} className="flex items-center gap-3">
                  <div className="w-[80px] text-[12px] text-right shrink-0 font-medium" style={{ color: x.color }}>{x.label}</div>
                  <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: '#f3f4f6' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(x.count / maxStatus) * 100}%`, background: x.color, transition: 'width 0.6s ease' }}
                    />
                  </div>
                  <div className="w-12 text-right shrink-0">
                    <span className="text-[13px] font-semibold text-[#1a1a1a]">{x.count}</span>
                    <span className="text-[11px] text-[#9ca3af] ml-1">({total ? Math.round((x.count/total)*100) : 0}%)</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Donut-style summary */}
            <div className="px-6 pb-5 border-t border-[#f3f4f6] pt-4 flex flex-wrap gap-3">
              {byStatus.map(x => (
                <div key={x.status} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: x.color }} />
                  <span className="text-[12px] text-[#6b7280]">{x.label}: {x.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent requests table */}
        <div className="mt-6 bg-white border border-[#e5e7eb] rounded-lg overflow-hidden" style={CARD_SHADOW}>
          <div className="px-6 py-5 border-b border-[#e5e7eb] flex items-center justify-between">
            <h2 className="font-medium text-[16px] text-[#1a1a1a] tracking-[-0.5px]">Riwayat Permohonan Terkini</h2>
            <span className="text-[12px] text-[#9ca3af]">10 terakhir</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
                  <th className="px-6 py-3 text-left text-[12px] font-medium text-[#6b7280] uppercase tracking-wide">No. Permohonan</th>
                  <th className="px-6 py-3 text-left text-[12px] font-medium text-[#6b7280] uppercase tracking-wide">Nama Pemohon</th>
                  <th className="px-6 py-3 text-left text-[12px] font-medium text-[#6b7280] uppercase tracking-wide">Layanan</th>
                  <th className="px-6 py-3 text-left text-[12px] font-medium text-[#6b7280] uppercase tracking-wide">Tanggal</th>
                  <th className="px-6 py-3 text-left text-[12px] font-medium text-[#6b7280] uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-[14px] text-[#6b7280]">Memuat data...</td>
                  </tr>
                ) : recent.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-[14px] text-[#6b7280]">Belum ada permohonan</td>
                  </tr>
                ) : recent.map((req, i) => {
                  const s = STATUS_CFG[req.status] ?? STATUS_CFG.pending
                  return (
                    <tr key={req.id} className="border-b border-[#f3f4f6] hover:bg-[#fafafa] transition-colors">
                      <td className="px-6 py-3.5" style={{ fontFamily: 'Menlo, monospace', fontSize: '11px', color: '#6b7280' }}>
                        REQ-{req.id.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-6 py-3.5 font-medium text-[#1a1a1a]">{req.profiles?.full_name ?? '—'}</td>
                      <td className="px-6 py-3.5 text-[#6b7280]">{shortLabel(SERVICE_TYPE_LABELS[req.service_type] ?? req.service_type)}</td>
                      <td className="px-6 py-3.5 text-[#6b7280]">{formatDate(req.created_at)}</td>
                      <td className="px-6 py-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium" style={{ background: s.bg, color: s.color }}>
                          {s.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
