import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import { ROUTES } from '../../routes/routes'
import { supabase } from '../../services/supabase'
import * as documentService from '../../services/documentService'
import { ocrDocument } from '../../services/geminiService'

// ── Constants ─────────────────────────────────────────────────────────────────

const HERO_GRADIENT = 'linear-gradient(90deg, #1e40af 0%, #10b981 100%)'
const CARD_SHADOW = { boxShadow: '0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)' }

const SERVICES = [
  { id: 'domisili',  label: 'Surat Keterangan Domisili',      desc: 'Bukti tempat tinggal resmi',              duration: '2–3 hari' },
  { id: 'pengantar', label: 'Surat Pengantar',                 desc: 'Pengantar untuk keperluan umum',          duration: '1–2 hari' },
  { id: 'sktm',      label: 'Surat Keterangan Tidak Mampu',   desc: 'Keterangan kondisi ekonomi',              duration: '2–3 hari' },
  { id: 'usaha',     label: 'Surat Keterangan Usaha',         desc: 'Legalitas usaha mikro/kecil',             duration: '3–5 hari' },
  { id: 'kelahiran', label: 'Surat Keterangan Kelahiran',     desc: 'Keterangan kelahiran anak',               duration: '1–2 hari' },
  { id: 'kematian',  label: 'Surat Keterangan Kematian',      desc: 'Keterangan anggota keluarga wafat',       duration: '1–2 hari' },
]

const SERVICE_LABELS = Object.fromEntries(SERVICES.map(s => [s.id, s.label]))

const STEPS = ['Pilih Layanan', 'Unggah Dokumen', 'Verifikasi AI', 'Konfirmasi']

// ── AI processing — real Gemini OCR with mock fallback ───────────────────────

const MOCK_EXTRACTED = {
  name: '',
  nik: '3401012345678901',
  address: 'Jl. Raya Wates No. 5 RT 003/RW 002, Desa Wates, Kec. Tanjunganom, Kab. Nganjuk',
  birthPlace: 'Nganjuk',
  birthDate: '1992-08-17',
}

async function runAIProcessing(ktpFile, userName) {
  const ocr = await ocrDocument(ktpFile)

  if (!ocr) {
    // No API key or OCR failed — use mock after simulated delay
    await new Promise(r => setTimeout(r, 2800))
    return {
      quality: { ktp: 'good', kk: 'good' },
      completeness: { name: true, nik: true, address: true, birthDate: true },
      extracted: { ...MOCK_EXTRACTED, name: userName || '' },
    }
  }

  const ktpQuality = ocr.quality === 'bad' ? 'bad' : ocr.quality === 'blurry' ? 'blurry' : 'good'
  return {
    quality: { ktp: ktpQuality, kk: 'good' },
    completeness: {
      name:      !!ocr.nama,
      nik:       ocr.nik.length === 16,
      address:   !!ocr.alamat,
      birthDate: !!ocr.tanggalLahir,
    },
    extracted: {
      name:       ocr.nama       || userName || '',
      nik:        ocr.nik        || '',
      address:    ocr.alamat     || '',
      birthPlace: ocr.tempatLahir || '',
      birthDate:  ocr.tanggalLahir || '',
    },
  }
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function DocumentIcon({ color = '#6b7280', size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
    </svg>
  )
}

function CheckIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="#e5e7eb" strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="#1e40af" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((label, i) => {
        const idx = i + 1
        const done = idx < current
        const active = idx === current
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold transition-colors"
                style={{
                  background: done ? '#10b981' : active ? '#1e40af' : '#e5e7eb',
                  color: done || active ? '#fff' : '#9ca3af',
                }}
              >
                {done ? <CheckIcon /> : idx}
              </div>
              <span
                className="text-[11px] font-medium leading-4 whitespace-nowrap hidden sm:block"
                style={{ color: active ? '#1e40af' : done ? '#10b981' : '#9ca3af' }}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="w-16 sm:w-24 h-px mx-1 mb-5"
                style={{ background: done ? '#10b981' : '#e5e7eb' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function UploadZone({ label, file, preview, onFile, accept = 'image/*' }) {
  const inputRef = useRef(null)

  function handleDrop(e) {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) onFile(f)
  }

  function handleChange(e) {
    const f = e.target.files[0]
    if (f) onFile(f)
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="font-medium text-[14px] text-[#1a1a1a] leading-5">{label}</p>
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="relative border-2 border-dashed rounded-lg cursor-pointer transition-colors overflow-hidden"
        style={{
          borderColor: file ? '#10b981' : '#d1d5db',
          background: file ? 'rgba(16,185,129,0.03)' : '#fafafa',
          minHeight: 140,
        }}
      >
        {preview ? (
          <div className="relative">
            <img src={preview} alt={label} className="w-full h-36 object-cover" />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <span className="text-white text-[13px] font-medium">Ganti Foto</span>
            </div>
            <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <CheckIcon size={12} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-8">
            <UploadIcon />
            <p className="text-[13px] text-[#6b7280] leading-5 text-center px-4">
              Klik atau seret foto di sini
            </p>
            <p className="text-[11px] text-[#9ca3af]">JPG, PNG, maks. 5MB</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />
      </div>
      {file && (
        <p className="text-[12px] text-green-600 leading-4">✓ {file.name}</p>
      )}
    </div>
  )
}

function QualityBadge({ status }) {
  const map = {
    good:      { label: 'Kualitas Baik',    bg: 'rgba(16,185,129,0.1)',  color: '#059669' },
    blurred:   { label: 'Foto Buram',        bg: 'rgba(245,158,11,0.1)',  color: '#d97706' },
    dark:      { label: 'Foto Terlalu Gelap',bg: 'rgba(245,158,11,0.1)', color: '#d97706' },
    invalid:   { label: 'Format Tidak Valid',bg: 'rgba(239,68,68,0.1)',   color: '#dc2626' },
  }
  const s = map[status] ?? map.good
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium"
      style={{ background: s.bg, color: s.color }}
    >
      {status === 'good' && <CheckIcon size={12} />}
      {s.label}
    </span>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function RequestDocumentPage() {
  const navigate   = useNavigate()
  const { user }   = useAuthContext()

  const [step, setStep] = useState(1)

  // Step 1
  const [selectedService, setSelectedService] = useState(null)
  const [purpose, setPurpose]                 = useState('')
  const [step1Errors, setStep1Errors]         = useState({})

  // Step 2
  const [ktpFile, setKtpFile]       = useState(null)
  const [kkFile, setKkFile]         = useState(null)
  const [ktpPreview, setKtpPreview] = useState(null)
  const [kkPreview, setKkPreview]   = useState(null)
  const [step2Error, setStep2Error] = useState('')

  // Step 3 – AI
  const [aiLoading, setAiLoading]   = useState(false)
  const [aiResult, setAiResult]     = useState(null)
  const [aiProgress, setAiProgress] = useState(0)
  const [extracted, setExtracted]   = useState({
    name: '', nik: '', birthPlace: '', birthDate: '', address: '',
  })

  // Step 4 – Submit
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)
  const [requestId, setRequestId]   = useState(null)
  const [submitError, setSubmitError] = useState('')

  // ── File handlers ──────────────────────────────────────────────────────────

  function handleKtpFile(file) {
    setKtpFile(file)
    setKtpPreview(URL.createObjectURL(file))
    setStep2Error('')
  }

  function handleKkFile(file) {
    setKkFile(file)
    setKkPreview(URL.createObjectURL(file))
    setStep2Error('')
  }

  // ── Step navigation ────────────────────────────────────────────────────────

  function goStep1() {
    const e = {}
    if (!selectedService) e.service = 'Pilih jenis layanan yang dibutuhkan.'
    if (!purpose.trim())  e.purpose = 'Tuliskan keperluan Anda.'
    if (Object.keys(e).length) { setStep1Errors(e); return }
    setStep1Errors({})
    setStep(2)
  }

  async function goStep3() {
    if (!ktpFile || !kkFile) {
      setStep2Error('Unggah foto KTP dan KK terlebih dahulu.')
      return
    }
    setStep2Error('')
    setStep(3)
    setAiLoading(true)
    setAiProgress(0)

    // progress animation
    const timer = setInterval(() => setAiProgress(p => Math.min(p + 12, 90)), 300)

    const result = await runAIProcessing(ktpFile, user?.name)

    clearInterval(timer)
    setAiProgress(100)
    await new Promise(r => setTimeout(r, 400))

    setAiResult(result)
    setExtracted(result.extracted)
    setAiLoading(false)
  }

  async function handleSubmit() {
    setSubmitting(true)
    setSubmitError('')

    if (!supabase) {
      // Demo mode — simulate success and persist to sessionStorage
      await new Promise(r => setTimeout(r, 1000))
      const newId = 'DEMO-' + Date.now().toString().slice(-6)
      const existing = JSON.parse(sessionStorage.getItem('sadewa_demo_requests') ?? '[]')
      existing.unshift({ id: newId, service_type: selectedService, status: 'pending', created_at: new Date().toISOString() })
      sessionStorage.setItem('sadewa_demo_requests', JSON.stringify(existing))
      setRequestId(newId)
      setSubmitted(true)
      setSubmitting(false)
      return
    }

    try {
      // Upload files to Supabase Storage
      const [ktpRes, kkRes] = await Promise.all([
        documentService.uploadDocument(ktpFile, user.id, 'ktp.jpg'),
        documentService.uploadDocument(kkFile, user.id, 'kk.jpg'),
      ])

      if (!ktpRes.ok || !kkRes.ok) {
        setSubmitError('Gagal mengunggah dokumen. Coba lagi.')
        setSubmitting(false)
        return
      }

      // Save request to DB
      const reqRes = await documentService.createDocumentRequest({
        user_id: user.id,
        service_type: selectedService,
        status: 'pending',
        ktp_url: ktpRes.url,
        kk_url: kkRes.url,
        purpose,
        ai_reading_status: aiResult.quality.ktp === 'good' ? 'success' : 'warning',
        document_quality_status: aiResult.quality.ktp,
      })

      if (!reqRes.ok) {
        setSubmitError('Gagal menyimpan permohonan. Coba lagi.')
        setSubmitting(false)
        return
      }

      // Save extracted OCR data
      await documentService.saveExtractedDocument(reqRes.request.id, {
        full_name: extracted.name,
        nik: extracted.nik,
        birth_date: `${extracted.birthPlace}, ${extracted.birthDate}`,
        address: extracted.address,
      })

      setRequestId(reqRes.request.id.slice(0, 8).toUpperCase())
      setSubmitted(true)
    } catch {
      setSubmitError('Terjadi kesalahan. Coba lagi.')
    }

    setSubmitting(false)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const inputBase =
    'w-full h-10 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg px-[13px] text-[14px] text-[#1a1a1a] placeholder-[rgba(26,26,26,0.4)] tracking-[-0.15px] focus:outline-none focus:ring-2 focus:ring-[#1e40af] focus:border-transparent'

  if (submitted) {
    return (
      <div>
        <section style={{ background: HERO_GRADIENT }} className="py-8">
          <div className="max-w-[1280px] mx-auto px-4">
            <h1 className="font-medium text-[36px] text-white leading-10 tracking-[0.37px]">Permohonan Baru</h1>
          </div>
        </section>
        <div className="max-w-[1280px] mx-auto px-4 py-12 flex justify-center">
          <div className="bg-white border border-[#e5e7eb] rounded-xl p-10 max-w-md w-full text-center" style={CARD_SHADOW}>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="font-semibold text-[20px] text-[#1a1a1a] mb-2">Permohonan Terkirim!</h2>
            <p className="text-[14px] text-[#6b7280] leading-6 mb-6">
              Permohonan Anda telah diterima dan sedang menunggu verifikasi admin.
              Nomor permohonan Anda:
            </p>
            <div className="bg-[#f3f4f6] rounded-lg px-4 py-3 mb-8">
              <p className="font-mono font-semibold text-[18px] text-[#1a1a1a] tracking-widest">
                REQ-{requestId}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate(ROUTES.CITIZEN_TRACK)}
                className="w-full h-11 bg-[#1e40af] rounded-lg text-white font-medium text-[15px] hover:bg-[#1e3a8a] transition-colors border-0 cursor-pointer"
              >
                Pantau Status
              </button>
              <button
                onClick={() => navigate(ROUTES.CITIZEN_DASHBOARD)}
                className="w-full h-11 bg-white border border-[#e5e7eb] rounded-lg text-[#1a1a1a] font-medium text-[15px] hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Kembali ke Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Hero */}
      <section style={{ background: HERO_GRADIENT }} className="py-8">
        <div className="max-w-[1280px] mx-auto px-4">
          <h1 className="font-medium text-[36px] text-white leading-10 tracking-[0.37px]">Permohonan Baru</h1>
          <p className="mt-2 text-[16px] leading-6 tracking-[-0.31px]" style={{ color: 'rgba(255,255,255,0.9)' }}>
            Ajukan permohonan layanan administrasi desa
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-[1280px] mx-auto px-4 py-10">
        <div className="max-w-[720px] mx-auto">
          <StepIndicator current={step} />

          {/* ── Step 1: Pilih Layanan ── */}
          {step === 1 && (
            <div className="bg-white border border-[#e5e7eb] rounded-xl" style={CARD_SHADOW}>
              <div className="px-6 pt-6 pb-4 border-b border-[#e5e7eb]">
                <h2 className="font-semibold text-[18px] text-[#1a1a1a]">Pilih Layanan</h2>
                <p className="mt-1 text-[14px] text-[#6b7280]">Pilih jenis surat yang Anda butuhkan</p>
              </div>
              <div className="p-6 flex flex-col gap-6">
                {/* Service grid */}
                <div>
                  <div className="grid grid-cols-2 gap-3">
                    {SERVICES.map(svc => {
                      const sel = selectedService === svc.id
                      return (
                        <button
                          key={svc.id}
                          type="button"
                          onClick={() => { setSelectedService(svc.id); setStep1Errors(e => ({ ...e, service: '' })) }}
                          className="text-left p-4 rounded-lg border-2 transition-all cursor-pointer"
                          style={{
                            borderColor: sel ? '#1e40af' : '#e5e7eb',
                            background: sel ? 'rgba(30,64,175,0.04)' : 'white',
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                              style={{ background: sel ? 'rgba(30,64,175,0.1)' : '#f3f4f6' }}
                            >
                              <DocumentIcon color={sel ? '#1e40af' : '#6b7280'} size={16} />
                            </div>
                            <div>
                              <p className="font-medium text-[13px] text-[#1a1a1a] leading-5">{svc.label}</p>
                              <p className="mt-0.5 text-[11px] text-[#6b7280]">{svc.desc}</p>
                              <p className="mt-1 text-[11px] text-[#9ca3af]">Estimasi: {svc.duration}</p>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                  {step1Errors.service && <p className="mt-2 text-[12px] text-red-500">{step1Errors.service}</p>}
                </div>

                {/* Purpose */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-medium text-[14px] text-[#1a1a1a]">Keperluan / Alasan</label>
                  <textarea
                    value={purpose}
                    onChange={e => { setPurpose(e.target.value); setStep1Errors(err => ({ ...err, purpose: '' })) }}
                    placeholder="Contoh: Saya membutuhkan surat domisili untuk keperluan melamar pekerjaan..."
                    rows={3}
                    className={`w-full bg-[#f9fafb] border rounded-lg px-[13px] py-[9px] text-[14px] text-[#1a1a1a] placeholder-[rgba(26,26,26,0.4)] leading-5 resize-none focus:outline-none focus:ring-2 focus:ring-[#1e40af] focus:border-transparent ${step1Errors.purpose ? 'border-red-400' : 'border-[#e5e7eb]'}`}
                  />
                  {step1Errors.purpose && <p className="text-[12px] text-red-500">{step1Errors.purpose}</p>}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={goStep1}
                    className="flex items-center gap-2 h-10 px-6 bg-[#1e40af] text-white rounded-lg font-medium text-[14px] hover:bg-[#1e3a8a] transition-colors border-0 cursor-pointer"
                  >
                    Lanjut <ChevronRightIcon />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Unggah Dokumen ── */}
          {step === 2 && (
            <div className="bg-white border border-[#e5e7eb] rounded-xl" style={CARD_SHADOW}>
              <div className="px-6 pt-6 pb-4 border-b border-[#e5e7eb]">
                <h2 className="font-semibold text-[18px] text-[#1a1a1a]">Unggah Dokumen</h2>
                <p className="mt-1 text-[14px] text-[#6b7280]">
                  Foto KTP dan KK akan dibaca otomatis oleh sistem AI
                </p>
              </div>
              <div className="p-6 flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <UploadZone
                    label="Foto KTP"
                    file={ktpFile}
                    preview={ktpPreview}
                    onFile={handleKtpFile}
                  />
                  <UploadZone
                    label="Foto KK (Kartu Keluarga)"
                    file={kkFile}
                    preview={kkPreview}
                    onFile={handleKkFile}
                  />
                </div>

                {step2Error && <p className="text-[13px] text-red-500">{step2Error}</p>}

                <div
                  className="flex items-start gap-3 p-4 rounded-lg"
                  style={{ background: 'rgba(30,64,175,0.05)', border: '1px solid rgba(30,64,175,0.12)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e40af" strokeWidth="2" className="shrink-0 mt-0.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                  </svg>
                  <p className="text-[13px] text-[#1e40af] leading-5">
                    Pastikan foto jelas, tidak buram, dan tidak terpotong. AI akan membaca data secara otomatis.
                  </p>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="h-10 px-5 bg-white border border-[#e5e7eb] text-[#1a1a1a] rounded-lg font-medium text-[14px] hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Kembali
                  </button>
                  <button
                    onClick={goStep3}
                    className="flex items-center gap-2 h-10 px-6 bg-[#1e40af] text-white rounded-lg font-medium text-[14px] hover:bg-[#1e3a8a] transition-colors border-0 cursor-pointer"
                  >
                    Proses dengan AI <ChevronRightIcon />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: AI Verification ── */}
          {step === 3 && (
            <div className="bg-white border border-[#e5e7eb] rounded-xl" style={CARD_SHADOW}>
              <div className="px-6 pt-6 pb-4 border-b border-[#e5e7eb]">
                <h2 className="font-semibold text-[18px] text-[#1a1a1a]">Verifikasi AI</h2>
                <p className="mt-1 text-[14px] text-[#6b7280]">
                  {aiLoading ? 'Sistem AI sedang membaca dokumen Anda...' : 'Periksa dan konfirmasi data yang dibaca AI'}
                </p>
              </div>
              <div className="p-6">
                {aiLoading ? (
                  <AIProcessingState progress={aiProgress} />
                ) : aiResult ? (
                  <AIResultState
                    result={aiResult}
                    extracted={extracted}
                    setExtracted={setExtracted}
                    inputBase={inputBase}
                    onBack={() => setStep(2)}
                    onConfirm={() => setStep(4)}
                  />
                ) : null}
              </div>
            </div>
          )}

          {/* ── Step 4: Confirmation ── */}
          {step === 4 && (
            <div className="bg-white border border-[#e5e7eb] rounded-xl" style={CARD_SHADOW}>
              <div className="px-6 pt-6 pb-4 border-b border-[#e5e7eb]">
                <h2 className="font-semibold text-[18px] text-[#1a1a1a]">Konfirmasi Permohonan</h2>
                <p className="mt-1 text-[14px] text-[#6b7280]">Periksa kembali sebelum mengirim</p>
              </div>
              <div className="p-6 flex flex-col gap-5">

                {/* Summary */}
                <div className="flex flex-col gap-3">
                  <SummaryRow label="Jenis Layanan"   value={SERVICE_LABELS[selectedService]} />
                  <SummaryRow label="Keperluan"        value={purpose} />
                  <SummaryRow label="Nama Lengkap"     value={extracted.name} />
                  <SummaryRow label="NIK"              value={extracted.nik} mono />
                  <SummaryRow label="Tempat, Tgl Lahir" value={`${extracted.birthPlace}, ${extracted.birthDate}`} />
                  <SummaryRow label="Alamat"           value={extracted.address} />
                </div>

                {/* Document preview thumbnails */}
                <div className="flex gap-4 pt-2">
                  {ktpPreview && (
                    <div className="flex flex-col gap-1">
                      <p className="text-[12px] text-[#6b7280] font-medium">KTP</p>
                      <img src={ktpPreview} className="w-28 h-16 object-cover rounded-lg border border-[#e5e7eb]" alt="KTP" />
                    </div>
                  )}
                  {kkPreview && (
                    <div className="flex flex-col gap-1">
                      <p className="text-[12px] text-[#6b7280] font-medium">KK</p>
                      <img src={kkPreview} className="w-28 h-16 object-cover rounded-lg border border-[#e5e7eb]" alt="KK" />
                    </div>
                  )}
                </div>

                {submitError && <p className="text-[13px] text-red-500">{submitError}</p>}

                <div className="flex justify-between pt-2">
                  <button
                    onClick={() => setStep(3)}
                    className="h-10 px-5 bg-white border border-[#e5e7eb] text-[#1a1a1a] rounded-lg font-medium text-[14px] hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Kembali
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex items-center gap-2 h-10 px-6 bg-[#1e40af] text-white rounded-lg font-medium text-[14px] hover:bg-[#1e3a8a] transition-colors border-0 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Mengirim...' : 'Kirim Permohonan'}
                    {!submitting && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── AI Processing sub-components ──────────────────────────────────────────────

const AI_STEPS = [
  'Membaca kualitas dokumen...',
  'Mengekstrak data KTP...',
  'Mengekstrak data KK...',
  'Memeriksa kelengkapan data...',
]

function AIProcessingState({ progress }) {
  const activeStep = Math.min(Math.floor((progress / 100) * AI_STEPS.length), AI_STEPS.length - 1)
  return (
    <div className="flex flex-col items-center py-10 gap-8">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" fill="none" stroke="#e5e7eb" strokeWidth="6" />
          <circle
            cx="40" cy="40" r="34" fill="none"
            stroke="#1e40af" strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 34}`}
            strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress / 100)}`}
            style={{ transition: 'stroke-dashoffset 0.3s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[14px] font-semibold text-[#1e40af]">{progress}%</span>
        </div>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {AI_STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-3">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors"
              style={{
                background: i < activeStep ? '#10b981' : i === activeStep ? '#1e40af' : '#e5e7eb',
              }}
            >
              {i < activeStep
                ? <CheckIcon size={10} />
                : i === activeStep
                ? <SpinnerIcon />
                : null}
            </div>
            <span
              className="text-[13px] leading-5"
              style={{ color: i <= activeStep ? '#1a1a1a' : '#9ca3af' }}
            >
              {s}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AIResultState({ result, extracted, setExtracted, inputBase, onBack, onConfirm }) {
  function field(key, label, placeholder) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <label className="font-medium text-[13px] text-[#1a1a1a]">{label}</label>
          {result.completeness[key !== 'birthPlace' && key !== 'birthDate' ? key : 'birthDate'] && (
            <span className="text-[11px] text-green-600 flex items-center gap-0.5">
              <CheckIcon size={10} /> Terdeteksi
            </span>
          )}
        </div>
        <input
          type="text"
          value={extracted[key]}
          onChange={e => setExtracted(prev => ({ ...prev, [key]: e.target.value }))}
          placeholder={placeholder}
          className={inputBase}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Quality check */}
      <div className="flex flex-col gap-3">
        <p className="font-medium text-[14px] text-[#1a1a1a]">Kualitas Dokumen</p>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-[#6b7280]">KTP:</span>
            <QualityBadge status={result.quality.ktp} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-[#6b7280]">KK:</span>
            <QualityBadge status={result.quality.kk} />
          </div>
        </div>
      </div>

      <div className="border-t border-[#f3f4f6]" />

      {/* Extracted data */}
      <div className="flex flex-col gap-1">
        <p className="font-medium text-[14px] text-[#1a1a1a]">Data Hasil Pembacaan AI</p>
        <p className="text-[13px] text-[#6b7280]">Periksa dan koreksi jika ada kesalahan pembacaan</p>
      </div>

      <div className="flex flex-col gap-4">
        {field('name', 'Nama Lengkap', 'Nama sesuai KTP')}
        {field('nik', 'NIK', '16 digit NIK')}
        <div className="grid grid-cols-2 gap-4">
          {field('birthPlace', 'Tempat Lahir', 'Kota kelahiran')}
          {field('birthDate', 'Tanggal Lahir', 'YYYY-MM-DD')}
        </div>
        {field('address', 'Alamat', 'Alamat sesuai KTP')}
      </div>

      <div className="flex justify-between pt-2">
        <button
          onClick={onBack}
          className="h-10 px-5 bg-white border border-[#e5e7eb] text-[#1a1a1a] rounded-lg font-medium text-[14px] hover:bg-gray-50 transition-colors cursor-pointer"
        >
          Kembali
        </button>
        <button
          onClick={onConfirm}
          className="flex items-center gap-2 h-10 px-6 bg-[#1e40af] text-white rounded-lg font-medium text-[14px] hover:bg-[#1e3a8a] transition-colors border-0 cursor-pointer"
        >
          Konfirmasi Data <ChevronRightIcon />
        </button>
      </div>
    </div>
  )
}

function SummaryRow({ label, value, mono = false }) {
  return (
    <div className="flex gap-4 py-3 border-b border-[#f3f4f6] last:border-0">
      <span className="text-[13px] text-[#6b7280] w-36 shrink-0">{label}</span>
      <span
        className="text-[13px] text-[#1a1a1a] flex-1"
        style={mono ? { fontFamily: 'Menlo, monospace', letterSpacing: '0.05em' } : {}}
      >
        {value || '—'}
      </span>
    </div>
  )
}
