import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ROUTES } from '../../routes/routes'
import { useAuthContext } from '../../context/AuthContext'
import { supabase } from '../../services/supabase'
import { getRequestById, updateKadesStatus } from '../../services/documentService'
import { formatDate } from '../../utils/formatDate'
import { SERVICE_TYPE_LABELS } from '../../utils/constants'

const HERO_GRADIENT = 'linear-gradient(90deg, #7c3aed 0%, #10b981 100%)'
const CARD_SHADOW = { boxShadow: '0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)' }

const STATUS_MAP = {
  kades_review: { bg: 'rgba(124,58,237,0.1)',  text: '#7c3aed', label: 'Menunggu TTD Kades' },
  signed:       { bg: 'rgba(16,185,129,0.1)',  text: '#10b981', label: 'Sudah Ditandatangani' },
  rejected:     { bg: 'rgba(239,68,68,0.1)',   text: '#ef4444', label: 'Ditolak' },
  pending:      { bg: 'rgba(59,130,246,0.1)',  text: '#3b82f6', label: 'Menunggu Tinjauan' },
  completed:    { bg: 'rgba(16,185,129,0.1)',  text: '#10b981', label: 'Selesai' },
}

const DEMO_REQUEST = {
  id: 'demo-req-006',
  service_type: 'sktm',
  status: 'kades_review',
  created_at: '2026-06-29T10:00:00Z',
  purpose: 'Untuk keperluan pengajuan keringanan biaya pengobatan di rumah sakit.',
  ktp_url: null,
  kk_url: null,
  admin_notes: 'Dokumen lengkap, layak diteruskan ke kepala desa.',
  kades_notes: null,
  profiles: { full_name: 'Andi Susanto', email: 'andi@example.com', nik: '3401012345678902' },
  extracted_documents: [{
    full_name: 'Andi Susanto',
    nik: '3401012345678902',
    birth_date: 'Kulon Progo, 1990-05-20',
    address: 'Jl. Wates Raya No. 10 RT 001/RW 003, Desa Wates, Kec. Wates, Kab. Kulon Progo',
  }],
}

function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  )
}
function CheckIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  )
}
function XMarkIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  )
}
function PenIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
    </svg>
  )
}

function SectionCard({ icon, title, children }) {
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-lg" style={CARD_SHADOW}>
      <div className="flex items-center gap-2 px-6 py-5 border-b border-[#e5e7eb]">
        {icon}
        <h2 className="font-medium text-[16px] text-[#1a1a1a] leading-6">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function InfoRow({ label, value, mono = false }) {
  return (
    <div>
      <p className="text-[12px] text-[#6b7280] leading-4 mb-1">{label}</p>
      <p className="text-[14px] text-[#1a1a1a] leading-5" style={mono ? { fontFamily: 'Menlo, monospace' } : {}}>
        {value || '—'}
      </p>
    </div>
  )
}

export default function KadesRequestDetailPage() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const { user } = useAuthContext()

  const [req, setReq]           = useState(null)
  const [loading, setLoading]   = useState(true)
  const [catatan, setCatatan]   = useState('')
  const [action, setAction]     = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function load() {
      if (!supabase) { setReq(DEMO_REQUEST); setLoading(false); return }
      const data = await getRequestById(id)
      setReq(data ?? DEMO_REQUEST)
      setCatatan(data?.kades_notes ?? '')
      setLoading(false)
    }
    load()
  }, [id])

  async function handleAction(newStatus) {
    setSubmitting(true)
    if (supabase) {
      await updateKadesStatus(id, newStatus, catatan, user?.id)
    } else {
      await new Promise(r => setTimeout(r, 600))
    }
    setAction(newStatus)
    setReq(prev => ({ ...prev, status: newStatus }))
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <svg className="animate-spin w-7 h-7 text-[#7c3aed]" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#e5e7eb" strokeWidth="3" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    )
  }

  if (!req) return null

  const extracted      = req.extracted_documents?.[0] ?? null
  const currentStatus  = action ?? req.status
  const statusInfo     = STATUS_MAP[currentStatus] ?? STATUS_MAP.kades_review
  const isWaiting      = currentStatus === 'kades_review'
  const isDone         = currentStatus === 'signed' || currentStatus === 'rejected'

  return (
    <div>
      <section style={{ background: HERO_GRADIENT }} className="py-8">
        <div className="max-w-[1280px] mx-auto px-4">
          <h1 className="font-medium text-[36px] text-white leading-10 tracking-[0.37px]">Detail Permohonan</h1>
          <p className="mt-2 text-[15px] leading-6" style={{ color: 'rgba(255,255,255,0.85)', fontFamily: 'Menlo, monospace' }}>
            REQ-{id.slice(-6).toUpperCase()}
          </p>
        </div>
      </section>

      <div className="max-w-[1280px] mx-auto px-4 pb-12">
        {/* Back */}
        <div className="pt-6 pb-4">
          <button
            onClick={() => navigate(ROUTES.KADES_REQUESTS)}
            className="flex items-center gap-2 text-[14px] font-medium text-[#6b7280] hover:text-[#1a1a1a] transition-colors cursor-pointer border-0 bg-transparent p-0"
          >
            <ArrowLeftIcon /> Kembali ke Daftar Pengajuan
          </button>
        </div>

        {/* Action banner */}
        {action && (
          <div
            className="mb-6 rounded-lg px-4 py-3 flex items-center gap-3 text-[14px] font-medium"
            style={{
              background: action === 'signed' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              color:      action === 'signed' ? '#10b981' : '#ef4444',
            }}
          >
            {action === 'signed' ? <CheckIcon size={18} /> : <XMarkIcon size={18} />}
            {action === 'signed'
              ? 'Surat telah ditandatangani dan diteruskan ke admin.'
              : 'Permohonan telah ditolak.'}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
          {/* ── Left column ── */}
          <div className="flex flex-col gap-5">

            {/* Informasi Pemohon */}
            <SectionCard
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="1.75"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>}
              title="Informasi Pemohon"
            >
              <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                <InfoRow label="Nama Lengkap"     value={req.profiles?.full_name} />
                <InfoRow label="NIK"               value={req.profiles?.nik} mono />
                <InfoRow label="Email"             value={req.profiles?.email} />
                <InfoRow label="Jenis Layanan"     value={SERVICE_TYPE_LABELS[req.service_type] ?? req.service_type} />
                <InfoRow label="Tanggal Pengajuan" value={formatDate(req.created_at)} />
              </div>
              {req.purpose && (
                <div className="mt-5 pt-5 border-t border-[#f3f4f6]">
                  <p className="text-[12px] text-[#6b7280] mb-1">Keperluan / Alasan</p>
                  <p className="text-[14px] text-[#1a1a1a] leading-6">{req.purpose}</p>
                </div>
              )}
            </SectionCard>

            {/* Data OCR */}
            {extracted && (
              <SectionCard
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="1.75"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>}
                title="Data Dokumen (Hasil OCR)"
              >
                <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-4 grid grid-cols-2 gap-x-8 gap-y-4">
                  <InfoRow label="Nama Lengkap"      value={extracted.full_name} />
                  <InfoRow label="NIK"                value={extracted.nik} mono />
                  <InfoRow label="Tempat, Tgl Lahir"  value={extracted.birth_date} />
                  <InfoRow label="Alamat"             value={extracted.address} />
                </div>
              </SectionCard>
            )}

            {/* Catatan Admin */}
            {req.admin_notes && (
              <SectionCard
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.75"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" /></svg>}
                title="Catatan Admin"
              >
                <p className="text-[14px] text-[#1a1a1a] leading-6">{req.admin_notes}</p>
              </SectionCard>
            )}

            {/* Catatan Kepala Desa */}
            <SectionCard
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.75"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" /></svg>}
              title="Catatan Kepala Desa"
            >
              <textarea
                value={catatan}
                onChange={e => setCatatan(e.target.value)}
                disabled={isDone}
                placeholder="Tambahkan catatan (opsional)..."
                rows={4}
                className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-lg px-4 py-3 text-[14px] text-[#1a1a1a] leading-5 resize-none focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:border-transparent disabled:opacity-60"
              />
            </SectionCard>
          </div>

          {/* ── Right sidebar ── */}
          <div className="flex flex-col gap-4">
            {/* Status */}
            <div className="bg-white border border-[#e5e7eb] rounded-lg" style={CARD_SHADOW}>
              <div className="px-5 py-4 border-b border-[#e5e7eb]">
                <h3 className="font-medium text-[15px] text-[#1a1a1a]">Status Permohonan</h3>
              </div>
              <div className="px-5 py-4">
                <span className="px-3 py-1 rounded-full text-[13px] font-medium"
                  style={{ background: statusInfo.bg, color: statusInfo.text }}>
                  {statusInfo.label}
                </span>
                <div className="mt-4 flex flex-col gap-2 text-[13px]">
                  <div className="flex justify-between">
                    <span className="text-[#6b7280]">No. Permohonan</span>
                    <span className="font-medium text-[#1a1a1a]" style={{ fontFamily: 'Menlo, monospace', fontSize: 11 }}>
                      REQ-{id.slice(-6).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6b7280]">Tanggal Masuk</span>
                    <span className="font-medium text-[#1a1a1a]">{formatDate(req.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons — hanya muncul saat menunggu TTD */}
            {isWaiting && (
              <div className="bg-white border border-[#e5e7eb] rounded-lg" style={CARD_SHADOW}>
                <div className="px-5 py-4 border-b border-[#e5e7eb]">
                  <h3 className="font-medium text-[15px] text-[#1a1a1a]">Tindakan</h3>
                </div>
                <div className="px-5 py-4 flex flex-col gap-3">
                  <button
                    onClick={() => handleAction('signed')}
                    disabled={submitting}
                    className="w-full h-11 rounded-lg flex items-center justify-center gap-2 text-[15px] font-medium text-white hover:opacity-90 transition-opacity cursor-pointer border-0 disabled:opacity-60"
                    style={{ background: '#7c3aed' }}
                  >
                    <PenIcon />
                    {submitting ? 'Menyimpan...' : 'Tanda Tangani & Setujui'}
                  </button>
                  <button
                    onClick={() => handleAction('rejected')}
                    disabled={submitting}
                    className="w-full h-11 rounded-lg flex items-center justify-center gap-2 text-[15px] font-medium text-white hover:opacity-90 transition-opacity cursor-pointer border-0 disabled:opacity-60"
                    style={{ background: '#ef4444' }}
                  >
                    <XMarkIcon size={18} />
                    Tolak Permohonan
                  </button>
                </div>
              </div>
            )}

            {/* Info setelah TTD */}
            {currentStatus === 'signed' && (
              <div className="rounded-lg px-5 py-4 text-[13px]"
                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#059669' }}>
                <p className="font-medium mb-1">Surat telah ditandatangani</p>
                <p style={{ color: '#6b7280' }}>Admin akan memproses dan mengirimkan surat ke warga.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
