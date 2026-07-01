import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../routes/routes'
import { supabase } from '../../services/supabase'
import { getKadesRequests } from '../../services/documentService'
import { useAuthContext } from '../../context/AuthContext'

const HERO_GRADIENT = 'linear-gradient(90deg, #7c3aed 0%, #10b981 100%)'
const CARD_SHADOW = { boxShadow: '0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)' }

const DEMO_REQUESTS = [
  { id: 'demo-req-006', service_type: 'sktm',     status: 'kades_review', created_at: '2026-06-29T10:00:00Z', profiles: { full_name: 'Andi Susanto' } },
  { id: 'demo-req-007', service_type: 'domisili',  status: 'kades_review', created_at: '2026-06-29T09:00:00Z', profiles: { full_name: 'Rina Wijaya' } },
  { id: 'demo-req-008', service_type: 'pengantar', status: 'signed',       created_at: '2026-06-28T14:00:00Z', profiles: { full_name: 'Budi Hartono' } },
]

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-lg px-6 py-5 flex flex-col gap-1" style={CARD_SHADOW}>
      <p className="text-[13px] text-[#6b7280]">{label}</p>
      <p className="text-[32px] font-semibold tracking-[-1px]" style={{ color }}>{value}</p>
    </div>
  )
}

export default function KadesDashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const [requests, setRequests] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      if (!supabase) { setRequests(DEMO_REQUESTS); setLoading(false); return }
      const data = await getKadesRequests()
      setRequests(data)
      setLoading(false)
    }
    load()
  }, [])

  const waiting  = requests.filter(r => r.status === 'kades_review').length
  const signed   = requests.filter(r => r.status === 'signed').length
  const rejected = requests.filter(r => r.status === 'rejected').length
  const recent   = requests.filter(r => r.status === 'kades_review').slice(0, 5)

  return (
    <div>
      <section style={{ background: HERO_GRADIENT }} className="py-8">
        <div className="max-w-[1280px] mx-auto px-4">
          <h1 className="font-medium text-[36px] text-white leading-10 tracking-[0.37px]">
            Selamat datang, {user?.name ?? 'Kepala Desa'}
          </h1>
          <p className="mt-2 text-[16px] leading-6" style={{ color: 'rgba(255,255,255,0.9)' }}>
            {waiting > 0
              ? `${waiting} surat menunggu tanda tangan Anda`
              : 'Tidak ada surat yang menunggu tanda tangan'}
          </p>
        </div>
      </section>

      <div className="max-w-[1280px] mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <StatCard label="Menunggu TTD"        value={loading ? '—' : waiting}  color="#7c3aed" />
          <StatCard label="Sudah Ditandatangani" value={loading ? '—' : signed}   color="#10b981" />
          <StatCard label="Ditolak"              value={loading ? '—' : rejected} color="#ef4444" />
        </div>

        {/* Pengajuan masuk */}
        <div className="mt-6 bg-white border border-[#e5e7eb] rounded-lg overflow-hidden" style={CARD_SHADOW}>
          <div className="px-6 py-5 border-b border-[#e5e7eb] flex items-center justify-between">
            <h2 className="font-medium text-[18px] text-[#1a1a1a] tracking-[-0.89px]">
              Menunggu Tanda Tangan
            </h2>
            <button
              onClick={() => navigate(ROUTES.KADES_REQUESTS)}
              className="text-[13px] font-medium text-[#7c3aed] hover:underline cursor-pointer border-0 bg-transparent p-0"
            >
              Lihat semua
            </button>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center">
              <svg className="animate-spin w-6 h-6 text-[#7c3aed]" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#e5e7eb" strokeWidth="3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
          ) : recent.length === 0 ? (
            <p className="px-6 py-12 text-center text-[14px] text-[#6b7280]">
              Tidak ada surat yang menunggu tanda tangan
            </p>
          ) : (
            <div className="divide-y divide-[#f3f4f6]">
              {recent.map(req => (
                <div key={req.id} className="px-6 py-4 flex items-center justify-between hover:bg-[#fafafa] transition-colors">
                  <div>
                    <p className="text-[14px] font-medium text-[#1a1a1a]">{req.profiles?.full_name ?? '—'}</p>
                    <p className="text-[12px] text-[#6b7280] mt-0.5">
                      REQ-{req.id.slice(-6).toUpperCase()} · {req.service_type}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(ROUTES.KADES_REQUEST_DETAIL.replace(':id', req.id))}
                    className="h-8 px-4 rounded-lg text-[13px] font-medium text-white border-0 cursor-pointer hover:opacity-90 transition-opacity"
                    style={{ background: '#7c3aed' }}
                  >
                    Tinjau & TTD
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
