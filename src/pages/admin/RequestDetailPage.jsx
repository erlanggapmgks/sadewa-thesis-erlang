import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ROUTES } from '../../routes/routes'
import { useAuthContext } from '../../context/AuthContext'
import { supabase } from '../../services/supabase'
import { getRequestById, updateRequestStatus } from '../../services/documentService'
import { formatDate } from '../../utils/formatDate'
import { SERVICE_TYPE_LABELS } from '../../utils/constants'

// ── Constants ─────────────────────────────────────────────────────────────────

const HERO_GRADIENT = 'linear-gradient(90deg, #1e40af 0%, #10b981 100%)'
const CARD_SHADOW = { boxShadow: '0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)' }

const STATUS_MAP = {
  pending:      { bg: 'rgba(59,130,246,0.1)',  text: '#3b82f6', label: 'Menunggu Tinjauan' },
  kades_review: { bg: 'rgba(124,58,237,0.1)', text: '#7c3aed', label: 'Menunggu TTD Kades' },
  signed:       { bg: 'rgba(16,185,129,0.1)', text: '#10b981', label: 'Sudah Ditandatangani' },
  approved:     { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b', label: 'Disetujui' },
  rejected:     { bg: 'rgba(239,68,68,0.1)',  text: '#ef4444', label: 'Ditolak' },
  completed:    { bg: 'rgba(16,185,129,0.1)', text: '#10b981', label: 'Selesai' },
}

const QUALITY_MAP = {
  good:    { bg: 'rgba(16,185,129,0.1)',  text: '#059669', label: 'Kualitas Baik' },
  blurred: { bg: 'rgba(245,158,11,0.1)',  text: '#d97706', label: 'Foto Buram' },
  dark:    { bg: 'rgba(245,158,11,0.1)',  text: '#d97706', label: 'Foto Terlalu Gelap' },
  invalid: { bg: 'rgba(239,68,68,0.1)',   text: '#dc2626', label: 'Format Tidak Valid' },
}

const DEMO_REQUEST = {
  id: 'demo-req-001',
  service_type: 'sktm',
  status: 'pending',
  created_at: '2026-06-28T08:30:00Z',
  purpose: 'Untuk keperluan pengajuan keringanan biaya pengobatan di rumah sakit.',
  ktp_url: null,
  kk_url: null,
  ai_reading_status: 'success',
  document_quality_status: 'good',
  completeness_status: 'complete',
  recommended_letter_type: 'sktm',
  admin_notes: null,
  profiles: { full_name: 'Daniel Abraham', email: 'daniel@example.com', nik: '3401012345678901' },
  extracted_documents: [{
    full_name: 'Daniel Abraham',
    nik: '3401012345678901',
    birth_date: 'Nganjuk, 1992-08-17',
    address: 'Jl. Raya Wates No. 5 RT 003/RW 002, Desa Wates, Kec. Tanjunganom, Kab. Nganjuk',
    confidence: 0.92,
  }],
}

// ── Icons ─────────────────────────────────────────────────────────────────────

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

// ── Sub-components ────────────────────────────────────────────────────────────

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
      <p className="text-[14px] text-[#1a1a1a] leading-5" style={mono ? { fontFamily: 'Menlo, monospace', letterSpacing: 0 } : {}}>
        {value || '—'}
      </p>
    </div>
  )
}

function QualityBadge({ status }) {
  const q = QUALITY_MAP[status] ?? QUALITY_MAP.good
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium"
      style={{ background: q.bg, color: q.text }}>
      {status === 'good' && <CheckIcon size={11} />}
      {q.label}
    </span>
  )
}

function CompletenessRow({ label, ok }) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
        style={{ background: ok ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)' }}
      >
        {ok
          ? <CheckIcon size={11} />
          : <XMarkIcon size={11} />}
      </div>
      <span className="text-[13px]" style={{ color: ok ? '#059669' : '#dc2626' }}>{label}</span>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function RequestDetailPage() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const { user }   = useAuthContext()

  const [req, setReq]           = useState(null)
  const [loading, setLoading]   = useState(true)
  const [catatan, setCatatan]   = useState('')
  const [action, setAction]     = useState(null) // 'approved' | 'rejected' | null
  const [submitting, setSubmitting] = useState(false)
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    async function load() {
      if (!supabase) {
        setReq(DEMO_REQUEST)
        setLoading(false)
        return
      }
      const data = await getRequestById(id)
      setReq(data ?? DEMO_REQUEST)
      setCatatan(data?.admin_notes ?? '')
      setLoading(false)
    }
    load()
  }, [id])

  async function handleAction(newStatus) {
    setSubmitting(true)
    if (supabase) {
      await updateRequestStatus(id, newStatus, catatan, user?.id)
    } else {
      await new Promise(r => setTimeout(r, 600))
    }
    setAction(newStatus)
    setReq(prev => ({ ...prev, status: newStatus }))
    setSubmitting(false)
  }

  async function handleGenerateLetter() {
    setCompleting(true)
    await new Promise(r => setTimeout(r, 200))
    setCompleting(false)
    navigate(ROUTES.ADMIN_LETTER_PRINT.replace(':id', id))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <svg className="animate-spin w-7 h-7 text-[#1e40af]" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#e5e7eb" strokeWidth="3" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="#1e40af" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    )
  }

  if (!req) return null

  const extracted     = req.extracted_documents?.[0] ?? null
  const currentStatus = action ?? req.status
  const statusInfo    = STATUS_MAP[currentStatus] ?? STATUS_MAP.pending
  const isComplete    = req.completeness_status === 'complete'
  const isPending     = currentStatus === 'pending'
  const isKadesReview = currentStatus === 'kades_review'
  const canGenerate   = currentStatus === 'signed' || currentStatus === 'approved' || currentStatus === 'completed'
  const isDone        = !isPending

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
            onClick={() => navigate(ROUTES.ADMIN_REQUESTS)}
            className="flex items-center gap-2 text-[14px] font-medium text-[#6b7280] hover:text-[#1a1a1a] transition-colors cursor-pointer border-0 bg-transparent p-0"
          >
            <ArrowLeftIcon /> Kembali ke Daftar Permohonan
          </button>
        </div>

        {/* Action banner */}
        {action && (
          <div
            className="mb-6 rounded-lg px-4 py-3 flex items-center gap-3 text-[14px] font-medium"
            style={{
              background: action === 'rejected' ? 'rgba(239,68,68,0.1)' : 'rgba(124,58,237,0.1)',
              color:      action === 'rejected' ? '#ef4444' : '#7c3aed',
            }}
          >
            {action === 'rejected' ? <XMarkIcon size={18} /> : <CheckIcon size={18} />}
            {action === 'kades_review'
              ? 'Permohonan telah diteruskan ke Kepala Desa.'
              : action === 'rejected'
              ? 'Permohonan telah ditolak.'
              : 'Permohonan diproses.'}
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

            {/* AI Smart Processing */}
            <SectionCard
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e40af" strokeWidth="1.75"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>}
              title="Hasil Verifikasi AI"
            >
              <div className="flex flex-col gap-6">

                {/* Document quality */}
                <div>
                  <p className="text-[13px] font-medium text-[#1a1a1a] mb-3">Kualitas Dokumen</p>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] text-[#6b7280]">KTP:</span>
                      <QualityBadge status={req.document_quality_status ?? 'good'} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] text-[#6b7280]">KK:</span>
                      <QualityBadge status={req.document_quality_status ?? 'good'} />
                    </div>
                  </div>
                </div>

                {/* Completeness */}
                <div>
                  <p className="text-[13px] font-medium text-[#1a1a1a] mb-2">Kelengkapan Data</p>
                  <div className="grid grid-cols-2 gap-x-6">
                    <CompletenessRow label="Nama Lengkap"   ok={isComplete} />
                    <CompletenessRow label="NIK"             ok={isComplete} />
                    <CompletenessRow label="Tanggal Lahir"  ok={isComplete} />
                    <CompletenessRow label="Alamat"          ok={isComplete} />
                  </div>
                </div>

                {/* Extracted data */}
                {extracted && (
                  <div>
                    <p className="text-[13px] font-medium text-[#1a1a1a] mb-3">
                      Data Hasil Pembacaan OCR
                      {extracted.confidence && (
                        <span className="ml-2 text-[11px] text-green-600 font-normal">
                          {Math.round(extracted.confidence * 100)}% akurasi
                        </span>
                      )}
                    </p>
                    <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-4 grid grid-cols-2 gap-x-8 gap-y-4">
                      <InfoRow label="Nama Lengkap" value={extracted.full_name} />
                      <InfoRow label="NIK"           value={extracted.nik} mono />
                      <InfoRow label="Tempat, Tgl Lahir" value={extracted.birth_date} />
                      <InfoRow label="Alamat"        value={extracted.address} />
                    </div>
                  </div>
                )}

                {/* Recommended letter type */}
                {req.recommended_letter_type && (
                  <div className="flex items-start gap-3 p-4 rounded-lg"
                    style={{ background: 'rgba(30,64,175,0.05)', border: '1px solid rgba(30,64,175,0.12)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e40af" strokeWidth="2" className="shrink-0 mt-0.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                    </svg>
                    <div>
                      <p className="text-[13px] font-medium text-[#1e40af]">Rekomendasi AI</p>
                      <p className="text-[13px] text-[#1e40af] mt-0.5">
                        {SERVICE_TYPE_LABELS[req.recommended_letter_type] ?? req.recommended_letter_type}
                      </p>
                    </div>
                  </div>
                )}

                {/* Document images */}
                {(req.ktp_url || req.kk_url) && (
                  <div>
                    <p className="text-[13px] font-medium text-[#1a1a1a] mb-3">Dokumen Diunggah</p>
                    <div className="flex gap-4">
                      {req.ktp_url && (
                        <div className="flex flex-col gap-1">
                          <p className="text-[12px] text-[#6b7280]">KTP</p>
                          <a href={req.ktp_url} target="_blank" rel="noreferrer">
                            <img src={req.ktp_url} className="w-40 h-24 object-cover rounded-lg border border-[#e5e7eb] hover:opacity-90 transition-opacity" alt="KTP" />
                          </a>
                        </div>
                      )}
                      {req.kk_url && (
                        <div className="flex flex-col gap-1">
                          <p className="text-[12px] text-[#6b7280]">KK</p>
                          <a href={req.kk_url} target="_blank" rel="noreferrer">
                            <img src={req.kk_url} className="w-40 h-24 object-cover rounded-lg border border-[#e5e7eb] hover:opacity-90 transition-opacity" alt="KK" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Admin notes */}
            <SectionCard
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="1.75"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" /></svg>}
              title="Catatan Petugas"
            >
              <textarea
                value={catatan}
                onChange={e => setCatatan(e.target.value)}
                disabled={isDone}
                placeholder="Tambahkan catatan untuk pemohon (opsional)..."
                rows={4}
                className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-lg px-4 py-3 text-[14px] text-[#1a1a1a] leading-5 resize-none focus:outline-none focus:ring-2 focus:ring-[#1e40af] focus:border-transparent disabled:opacity-60"
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

            {/* Action buttons — admin hanya bisa teruskan ke kades atau tolak */}
            {isPending && (
              <div className="bg-white border border-[#e5e7eb] rounded-lg" style={CARD_SHADOW}>
                <div className="px-5 py-4 border-b border-[#e5e7eb]">
                  <h3 className="font-medium text-[15px] text-[#1a1a1a]">Tindakan</h3>
                </div>
                <div className="px-5 py-4 flex flex-col gap-3">
                  <button
                    onClick={() => handleAction('kades_review')}
                    disabled={submitting}
                    className="w-full h-11 rounded-lg flex items-center justify-center gap-2 text-[15px] font-medium text-white hover:opacity-90 transition-opacity cursor-pointer border-0 disabled:opacity-60"
                    style={{ background: '#7c3aed' }}
                  >
                    <CheckIcon size={18} />
                    {submitting ? 'Menyimpan...' : 'Teruskan ke Kepala Desa'}
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

            {/* Info saat menunggu TTD kades */}
            {isKadesReview && (
              <div className="rounded-lg px-5 py-4 text-[13px]"
                style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)', color: '#7c3aed' }}>
                <p className="font-medium mb-1">Menunggu tanda tangan Kepala Desa</p>
                <p style={{ color: '#6b7280' }}>Permohonan sudah diteruskan. Kepala Desa akan menandatangani atau menolak.</p>
              </div>
            )}

            {/* Generate letter — setelah kades TTD atau status lama 'approved' */}
            {canGenerate && (
              <div className="bg-white border border-[#e5e7eb] rounded-lg" style={CARD_SHADOW}>
                <div className="px-5 py-4 flex flex-col gap-2">
                  <button
                    onClick={handleGenerateLetter}
                    disabled={completing}
                    className="w-full h-11 rounded-lg flex items-center justify-center gap-2 text-[15px] font-medium text-white hover:opacity-90 transition-opacity cursor-pointer border-0 disabled:opacity-60"
                    style={{ background: 'linear-gradient(90deg, #1e40af, #10b981)' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
                    </svg>
                    {completing ? 'Memproses...' : 'Generate Surat'}
                  </button>
                  <p className="text-center text-[11px] text-[#9ca3af]">
                    {currentStatus === 'completed'
                      ? 'Cetak ulang surat yang sudah diterbitkan'
                      : 'Tandai selesai & buka preview untuk dicetak'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
