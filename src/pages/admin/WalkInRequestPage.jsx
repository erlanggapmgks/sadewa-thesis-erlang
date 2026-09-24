import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import { ROUTES } from '../../routes/routes'
import { supabase } from '../../services/supabase'
import * as documentService from '../../services/documentService'
import { ocrDocument, isOnline } from '../../services/geminiService'

// ── Constants ─────────────────────────────────────────────────────────────────

const HERO_GRADIENT = '#1e5fb8'
const CARD_SHADOW = { boxShadow: '0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)' }

const SERVICES = [
  { id: 'domisili',  label: 'Surat Keterangan Domisili',    desc: 'Bukti tempat tinggal resmi',          duration: '2–3 hari' },
  { id: 'pengantar', label: 'Surat Pengantar',               desc: 'Pengantar untuk keperluan umum',      duration: '1–2 hari' },
  { id: 'sktm',      label: 'Surat Keterangan Tidak Mampu', desc: 'Keterangan kondisi ekonomi',          duration: '2–3 hari' },
  { id: 'usaha',     label: 'Surat Keterangan Usaha',       desc: 'Legalitas usaha mikro/kecil',         duration: '3–5 hari' },
  { id: 'kelahiran', label: 'Surat Keterangan Kelahiran',   desc: 'Keterangan kelahiran anak',           duration: '1–2 hari' },
  { id: 'kematian',  label: 'Surat Keterangan Kematian',    desc: 'Keterangan anggota keluarga wafat',   duration: '1–2 hari' },
]

const SERVICE_LABELS = Object.fromEntries(SERVICES.map(s => [s.id, s.label]))

const ADDITIONAL_FIELDS = {
  usaha: [
    { key: 'nama_usaha',   label: 'Nama Usaha',   type: 'text',   placeholder: 'Contoh: Warung Makan Bu Sari', required: true },
    { key: 'jenis_usaha',  label: 'Jenis Usaha',  type: 'text',   placeholder: 'Contoh: Kuliner / Toko Sembako', required: true },
    { key: 'alamat_usaha', label: 'Alamat Usaha', type: 'text',   placeholder: 'Alamat tempat usaha beroperasi', required: true },
  ],
  kelahiran: [
    { key: 'nama_bayi',          label: 'Nama Bayi',          type: 'text',   placeholder: 'Nama lengkap bayi', required: true },
    { key: 'jenis_kelamin_bayi', label: 'Jenis Kelamin Bayi', type: 'select', options: ['Laki-laki', 'Perempuan'], required: true },
    { key: 'tanggal_lahir_bayi', label: 'Tanggal Lahir Bayi', type: 'date',   placeholder: '', required: true },
    { key: 'nama_ayah',          label: 'Nama Ayah',          type: 'text',   placeholder: 'Nama lengkap ayah', required: true },
    { key: 'nama_ibu',           label: 'Nama Ibu',           type: 'text',   placeholder: 'Nama lengkap ibu', required: true },
  ],
  kematian: [
    { key: 'nama_almarhum',     label: 'Nama Almarhum/ah',         type: 'text', placeholder: 'Nama lengkap', required: true },
    { key: 'tanggal_meninggal', label: 'Tanggal Meninggal',        type: 'date', placeholder: '', required: true },
    { key: 'tempat_meninggal',  label: 'Tempat Meninggal',         type: 'text', placeholder: 'Contoh: Rumah / RSUD Nganjuk', required: true },
    { key: 'penyebab_kematian', label: 'Penyebab Kematian',        type: 'text', placeholder: 'Contoh: Sakit keras', required: false },
    { key: 'nama_pelapor',      label: 'Nama Pelapor',             type: 'text', placeholder: 'Nama yang melaporkan', required: true },
    { key: 'hubungan_pelapor',  label: 'Hubungan dengan Almarhum', type: 'text', placeholder: 'Contoh: Anak / Istri / Suami', required: true },
  ],
}

const STEPS = ['Pilih Layanan', 'Scan KTP', 'Verifikasi AI', 'Konfirmasi']

// ── AI processing — Gemini Flash (primary) → Tesseract (fallback offline) ────

async function runAIProcessing(ktpFile) {
  const ocr = await ocrDocument(ktpFile)
  if (!ocr) return null
  const ktpQuality = ocr.quality === 'bad' ? 'bad' : ocr.quality === 'blurry' ? 'blurry' : 'good'
  return {
    engine: ocr.engine ?? 'gemini',   // 'gemini' | 'tesseract'
    quality: { ktp: ktpQuality },
    completeness: {
      name:      !!ocr.nama,
      nik:       ocr.nik?.length === 16,
      address:   !!ocr.alamat,
      birthDate: !!ocr.tanggalLahir,
    },
    extracted: {
      name:       ocr.nama         || '',
      nik:        ocr.nik          || '',
      address:    ocr.alamat       || '',
      birthPlace: ocr.tempatLahir  || '',
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
      <path d="M12 2a10 10 0 0 1 10 10" stroke="#1e5fb8" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((label, i) => {
        const idx = i + 1
        const done   = idx < current
        const active = idx === current
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold transition-colors"
                style={{
                  background: done ? '#16a372' : active ? '#1e5fb8' : '#e5e7eb',
                  color: done || active ? '#fff' : '#9ca3af',
                }}
              >
                {done ? <CheckIcon /> : idx}
              </div>
              <span
                className="text-[11px] font-medium leading-4 whitespace-nowrap hidden sm:block"
                style={{ color: active ? '#1e5fb8' : done ? '#16a372' : '#9ca3af' }}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="w-16 sm:w-24 h-px mx-1 mb-5"
                style={{ background: done ? '#16a372' : '#e5e7eb' }}
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
          borderColor: file ? '#16a372' : '#d1d5db',
          background: file ? 'rgba(22,163,114,0.03)' : '#fafafa',
          minHeight: 160,
        }}
      >
        {preview ? (
          <div className="relative">
            <img src={preview} alt={label} className="w-full h-40 object-cover" />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <span className="text-white text-[13px] font-medium">Ganti Foto</span>
            </div>
            <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <CheckIcon size={12} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-10">
            <UploadIcon />
            <p className="text-[13px] text-[#6b7280] leading-5 text-center px-4">Klik atau seret foto di sini</p>
            <p className="text-[11px] text-[#9ca3af]">JPG, PNG, maks. 5MB</p>
          </div>
        )}
        <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" />
      </div>
      {file && <p className="text-[12px] text-green-600 leading-4">✓ {file.name}</p>}
    </div>
  )
}

function QualityBadge({ status }) {
  const map = {
    good:    { label: 'Kualitas Baik',     bg: 'rgba(22,163,114,0.1)',  color: '#059669' },
    blurry:  { label: 'Foto Buram',        bg: 'rgba(245,158,11,0.1)',  color: '#d97706' },
    bad:     { label: 'Foto Tidak Valid',  bg: 'rgba(239,68,68,0.1)',   color: '#dc2626' },
  }
  const s = map[status] ?? map.good
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium" style={{ background: s.bg, color: s.color }}>
      {status === 'good' && <CheckIcon size={12} />}
      {s.label}
    </span>
  )
}

// Panel yang menampilkan hasil pencocokan NIK dengan database warga
function CitizenMatchPanel({ status, citizen }) {
  if (status === 'searching') {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg border border-[#e5e7eb] bg-[#f9fafb]">
        <svg className="animate-spin w-4 h-4 text-[#1e5fb8] shrink-0" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#e5e7eb" strokeWidth="3" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="#1e5fb8" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <span className="text-[13px] text-[#6b7280]">Mencari data warga di sistem...</span>
      </div>
    )
  }

  if (status === 'found') {
    return (
      <div className="flex items-start gap-3 p-4 rounded-lg" style={{ background: 'rgba(22,163,114,0.07)', border: '1px solid rgba(22,163,114,0.2)' }}>
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
          <CheckIcon size={14} />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-green-700">Warga Ditemukan</p>
          <p className="text-[13px] text-green-700 mt-0.5">{citizen?.full_name}</p>
          <p className="text-[12px] text-green-600 mt-0.5">NIK: {citizen?.nik} · {citizen?.email}</p>
          <p className="text-[11px] text-green-600 mt-1">Permohonan akan dikaitkan dengan akun warga ini.</p>
        </div>
      </div>
    )
  }

  if (status === 'not_found') {
    return (
      <div className="flex items-start gap-3 p-4 rounded-lg" style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" className="shrink-0 mt-0.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
        <div>
          <p className="text-[13px] font-semibold text-amber-700">NIK Tidak Ditemukan di Sistem</p>
          <p className="text-[13px] text-amber-700 mt-0.5 leading-5">
            Warga belum memiliki akun. Permohonan tetap dapat diproses menggunakan data hasil scan KTP.
          </p>
        </div>
      </div>
    )
  }

  return null
}

function SummaryRow({ label, value, mono = false }) {
  return (
    <div className="flex gap-4 py-3 border-b border-[#f3f4f6] last:border-0">
      <span className="text-[13px] text-[#6b7280] w-36 shrink-0">{label}</span>
      <span className="text-[13px] text-[#1a1a1a] flex-1" style={mono ? { fontFamily: 'Menlo, monospace', letterSpacing: '0.05em' } : {}}>
        {value || '—'}
      </span>
    </div>
  )
}

// ── Engine badge ──────────────────────────────────────────────────────────────
function EngineBadge({ engine }) {
  const isOfflineEngine = engine === 'tesseract'
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium"
      style={{
        background: isOfflineEngine ? 'rgba(245,158,11,0.1)' : 'rgba(30,95,184,0.08)',
        color:      isOfflineEngine ? '#b45309'               : '#1e5fb8',
        border:     `1px solid ${isOfflineEngine ? 'rgba(245,158,11,0.25)' : 'rgba(30,95,184,0.15)'}`,
      }}
    >
      {isOfflineEngine ? (
        <>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z" />
          </svg>
          Offline · Tesseract OCR
        </>
      ) : (
        <>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
          </svg>
          Online · Gemini AI
        </>
      )}
    </span>
  )
}

const AI_STEPS_ONLINE  = [
  'Membaca kualitas dokumen...',
  'Mengekstrak data KTP...',
  'Memeriksa kelengkapan data...',
  'Menyelesaikan verifikasi AI...',
]
const AI_STEPS_OFFLINE = [
  'Memuat mesin Tesseract...',
  'Memproses gambar KTP...',
  'Mengekstrak teks dari KTP...',
  'Menganalisis data yang ditemukan...',
]

function AIProcessingState({ progress, offline = false }) {
  const AI_STEPS = offline ? AI_STEPS_OFFLINE : AI_STEPS_ONLINE
  const activeStep = Math.min(Math.floor((progress / 100) * AI_STEPS.length), AI_STEPS.length - 1)
  return (
    <div className="flex flex-col items-center py-10 gap-8">
      {offline && (
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium w-fit"
          style={{ background: 'rgba(245,158,11,0.1)', color: '#b45309', border: '1px solid rgba(245,158,11,0.25)' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z" />
          </svg>
          Mode Offline — Tesseract OCR
        </div>
      )}
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" fill="none" stroke="#e5e7eb" strokeWidth="6" />
          <circle
            cx="40" cy="40" r="34" fill="none"
            stroke={offline ? '#d97706' : '#1e5fb8'} strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 34}`}
            strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress / 100)}`}
            style={{ transition: 'stroke-dashoffset 0.3s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[14px] font-semibold" style={{ color: offline ? '#d97706' : '#1e5fb8' }}>
            {progress}%
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {AI_STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-3">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors"
              style={{ background: i < activeStep ? '#16a372' : i === activeStep ? (offline ? '#d97706' : '#1e5fb8') : '#e5e7eb' }}
            >
              {i < activeStep ? <CheckIcon size={10} /> : i === activeStep ? <SpinnerIcon /> : null}
            </div>
            <span className="text-[13px] leading-5" style={{ color: i <= activeStep ? '#1a1a1a' : '#9ca3af' }}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function WalkInRequestPage() {
  const navigate = useNavigate()
  const { user } = useAuthContext()

  const [step, setStep] = useState(1)

  // Step 1
  const [selectedService, setSelectedService]   = useState(null)
  const [purpose, setPurpose]                   = useState('')
  const [step1Errors, setStep1Errors]           = useState({})
  const [additionalData, setAdditionalData]     = useState({})
  const [additionalErrors, setAdditionalErrors] = useState({})

  // Step 2
  const [ktpFile, setKtpFile]       = useState(null)
  const [ktpPreview, setKtpPreview] = useState(null)
  const [step2Error, setStep2Error] = useState('')

  // Step 3 – AI
  const [aiLoading, setAiLoading]     = useState(false)
  const [aiResult, setAiResult]       = useState(null)
  const [aiProgress, setAiProgress]   = useState(0)
  const [extracted, setExtracted]     = useState({ name: '', nik: '', birthPlace: '', birthDate: '', address: '' })

  // Citizen lookup
  const [citizenStatus, setCitizenStatus] = useState(null) // null | 'searching' | 'found' | 'not_found'
  const [citizenData, setCitizenData]     = useState(null)

  // Step 4 – Submit
  const [imgZoomed, setImgZoomed]     = useState(false)

  const [submitting, setSubmitting]   = useState(false)
  const [submitted, setSubmitted]     = useState(false)
  const [requestId, setRequestId]     = useState(null)
  const [submitError, setSubmitError] = useState('')

  // ── Online/offline status ─────────────────────────────────────────────────
  const [isOffline, setIsOffline] = useState(false)
  useEffect(() => {
    isOnline().then(online => setIsOffline(!online))
    const handleOffline = () => setIsOffline(true)
    const handleOnline  = () => isOnline().then(online => setIsOffline(!online))
    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleKtpFile(file) {
    setKtpFile(file)
    setKtpPreview(URL.createObjectURL(file))
    setStep2Error('')
  }

  function goStep1() {
    const e = {}
    if (!selectedService) e.service = 'Pilih jenis layanan yang dibutuhkan.'
    if (!purpose.trim())  e.purpose = 'Tuliskan keperluan.'

    const addErrs = {}
    ;(ADDITIONAL_FIELDS[selectedService] ?? []).forEach(f => {
      if (f.required && !additionalData[f.key]?.toString().trim()) {
        addErrs[f.key] = `${f.label} wajib diisi.`
      }
    })

    if (Object.keys(e).length || Object.keys(addErrs).length) {
      setStep1Errors(e)
      setAdditionalErrors(addErrs)
      return
    }
    setStep1Errors({})
    setAdditionalErrors({})
    setStep(2)
  }

  async function goStep3() {
    if (!ktpFile) {
      setStep2Error('Unggah atau scan foto KTP terlebih dahulu.')
      return
    }
    setStep2Error('')
    setStep(3)
    setAiLoading(true)
    setAiProgress(0)
    setAiResult(null)
    setCitizenStatus(null)
    setCitizenData(null)

    const timer = setInterval(() => setAiProgress(p => Math.min(p + 12, 90)), 300)
    const result = await runAIProcessing(ktpFile)
    clearInterval(timer)
    setAiProgress(100)
    await new Promise(r => setTimeout(r, 400))

    if (!result) {
      setAiLoading(false)
      setStep(2)
      setStep2Error('Ekstraksi data KTP gagal. Pastikan foto KTP jelas dan coba unggah ulang.')
      return
    }

    setAiResult(result)
    setExtracted(result.extracted)
    setAiLoading(false)

    // Auto-lookup citizen by NIK setelah OCR selesai
    if (result.extracted.nik && supabase) {
      setCitizenStatus('searching')
      const citizen = await documentService.findCitizenByNik(result.extracted.nik)
      if (citizen) {
        setCitizenData(citizen)
        setCitizenStatus('found')
      } else {
        setCitizenStatus('not_found')
      }
    }
  }

  async function handleSubmit() {
    setSubmitting(true)
    setSubmitError('')

    if (!supabase) {
      await new Promise(r => setTimeout(r, 800))
      setRequestId('DEMO-' + Date.now().toString().slice(-6))
      setSubmitted(true)
      setSubmitting(false)
      return
    }

    try {
      // Pakai ID warga jika ditemukan, fallback ke ID admin sebagai folder storage
      const storageOwnerId = citizenData?.id ?? user.id
      const ktpRes = await documentService.uploadDocument(ktpFile, storageOwnerId, 'ktp.jpg')
      if (!ktpRes.ok) {
        setSubmitError('Gagal mengunggah dokumen KTP. Coba lagi.')
        setSubmitting(false)
        return
      }

      const hasAddData = Object.keys(additionalData).length > 0
      const reqRes = await documentService.createDocumentRequest({
        user_id: citizenData?.id ?? null,   // null jika warga belum punya akun
        submitted_by: user.id,              // admin yang menginput (audit trail)
        service_type: selectedService,
        status: 'pending',
        ktp_url: ktpRes.url,
        purpose,
        additional_data: hasAddData ? additionalData : null,
        ai_reading_status: aiResult?.quality?.ktp === 'good' ? 'success' : 'warning',
        document_quality_status: aiResult?.quality?.ktp ?? 'good',
      })

      if (!reqRes.ok) {
        setSubmitError('Gagal menyimpan permohonan. Coba lagi.')
        setSubmitting(false)
        return
      }

      await documentService.saveExtractedDocument(reqRes.request.id, {
        full_name: extracted.name,
        nik: extracted.nik,
        birth_date: `${extracted.birthPlace}, ${extracted.birthDate}`,
        address: extracted.address,
      })

      setRequestId(reqRes.request.id)
      setSubmitted(true)
    } catch {
      setSubmitError('Terjadi kesalahan. Coba lagi.')
    }

    setSubmitting(false)
  }

  function resetForm() {
    setStep(1)
    setSelectedService(null)
    setPurpose('')
    setStep1Errors({})
    setAdditionalData({})
    setAdditionalErrors({})
    setKtpFile(null)
    setKtpPreview(null)
    setStep2Error('')
    setAiLoading(false)
    setAiResult(null)
    setAiProgress(0)
    setExtracted({ name: '', nik: '', birthPlace: '', birthDate: '', address: '' })
    setCitizenStatus(null)
    setCitizenData(null)
    setSubmitting(false)
    setSubmitted(false)
    setRequestId(null)
    setSubmitError('')
  }

  // ── Shared input style ────────────────────────────────────────────────────
  const inputBase =
    'w-full h-10 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg px-[13px] text-[14px] text-[#1a1a1a] placeholder-[rgba(26,26,26,0.4)] tracking-[-0.15px] focus:outline-none focus:ring-2 focus:ring-[#1e5fb8] focus:border-transparent'

  // ── Success screen ────────────────────────────────────────────────────────
  if (submitted) {
    const shortId = requestId?.slice(0, 8).toUpperCase() ?? requestId
    return (
      <div>
        <section style={{ background: HERO_GRADIENT }} className="py-8">
          <div className="max-w-[1280px] mx-auto px-4">
            <h1 className="font-medium text-white leading-tight tracking-[0.37px]" style={{ fontSize: 'clamp(22px, 5vw, 36px)', lineHeight: '1.2' }}>Pengajuan Langsung</h1>
          </div>
        </section>
        <div className="max-w-[1280px] mx-auto px-4 py-12 flex justify-center">
          <div className="bg-white border border-[#e5e7eb] rounded-xl p-10 max-w-md w-full text-center" style={CARD_SHADOW}>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a372" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="font-semibold text-[20px] text-[#1a1a1a] mb-2">Permohonan Berhasil Dibuat!</h2>
            <p className="text-[14px] text-[#6b7280] leading-6 mb-2">
              Permohonan atas nama <strong>{citizenData?.full_name || extracted.name}</strong> telah masuk ke antrian.
            </p>
            <p className="text-[14px] text-[#6b7280] leading-6 mb-6">Nomor permohonan:</p>
            <div className="bg-[#f3f4f6] rounded-lg px-4 py-3 mb-8">
              <p className="font-mono font-semibold text-[18px] text-[#1a1a1a] tracking-widest">
                REQ-{shortId}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate(ROUTES.ADMIN_REQUEST_DETAIL.replace(':id', requestId))}
                className="w-full h-11 bg-[#1e5fb8] rounded-lg text-white font-medium text-[15px] hover:bg-[#1e3a8a] transition-colors border-0 cursor-pointer"
              >
                Tinjau Permohonan
              </button>
              <button
                onClick={resetForm}
                className="w-full h-11 bg-white border border-[#e5e7eb] rounded-lg text-[#1a1a1a] font-medium text-[15px] hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Pengajuan Warga Berikutnya
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div>
      {/* Hero */}
      <section style={{ background: HERO_GRADIENT }} className="py-8">
        <div className="max-w-[1280px] mx-auto px-4">
          <h1 className="font-medium text-white leading-tight tracking-[0.37px]" style={{ fontSize: 'clamp(22px, 5vw, 36px)', lineHeight: '1.2' }}>Pengajuan Langsung</h1>
          <p className="mt-2 text-[14px] sm:text-[16px] leading-6 tracking-[-0.31px]" style={{ color: 'rgba(255,255,255,0.9)' }}>
            Bantu warga yang datang langsung ke kantor — scan KTP, AI baca data otomatis
          </p>
        </div>
      </section>

      <div className="max-w-[1280px] mx-auto px-4 py-10">
        <div className="max-w-[720px] mx-auto">
          <StepIndicator current={step} />

          {/* ── Step 1: Pilih Layanan ── */}
          {step === 1 && (
            <div className="bg-white border border-[#e5e7eb] rounded-xl" style={CARD_SHADOW}>
              <div className="px-6 pt-6 pb-4 border-b border-[#e5e7eb]">
                <h2 className="font-semibold text-[18px] text-[#1a1a1a]">Pilih Layanan</h2>
                <p className="mt-1 text-[14px] text-[#6b7280]">Pilih jenis surat yang dibutuhkan warga</p>
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
                          onClick={() => {
                            setSelectedService(svc.id)
                            setAdditionalData({})
                            setAdditionalErrors({})
                            setStep1Errors(e => ({ ...e, service: '' }))
                          }}
                          className="text-center sm:text-left p-4 rounded-lg border-2 transition-all cursor-pointer"
                          style={{
                            borderColor: sel ? '#1e5fb8' : '#e5e7eb',
                            background: sel ? 'rgba(30,95,184,0.04)' : 'white',
                          }}
                        >
                          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3">
                            <div
                              className="w-10 h-10 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0"
                              style={{ background: sel ? 'rgba(30,95,184,0.1)' : '#f3f4f6' }}
                            >
                              <DocumentIcon color={sel ? '#1e5fb8' : '#6b7280'} size={16} />
                            </div>
                            <div className="w-full">
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
                    placeholder="Contoh: Warga membutuhkan surat domisili untuk keperluan melamar pekerjaan..."
                    rows={3}
                    className={`w-full bg-[#f9fafb] border rounded-lg px-[13px] py-[9px] text-[14px] text-[#1a1a1a] placeholder-[rgba(26,26,26,0.4)] leading-5 resize-none focus:outline-none focus:ring-2 focus:ring-[#1e5fb8] focus:border-transparent ${step1Errors.purpose ? 'border-red-400' : 'border-[#e5e7eb]'}`}
                  />
                  {step1Errors.purpose && <p className="text-[12px] text-red-500">{step1Errors.purpose}</p>}
                </div>

                {/* Data tambahan per jenis surat */}
                {selectedService && (ADDITIONAL_FIELDS[selectedService] ?? []).length > 0 && (
                  <div className="flex flex-col gap-4 pt-2">
                    <div>
                      <p className="font-semibold text-[14px] text-[#1a1a1a]">Data Tambahan</p>
                      <p className="text-[13px] text-[#6b7280] mt-0.5">
                        Informasi yang dibutuhkan untuk {SERVICE_LABELS[selectedService]}
                      </p>
                    </div>
                    {(ADDITIONAL_FIELDS[selectedService] ?? []).map(field => (
                      <div key={field.key} className="flex flex-col gap-1.5">
                        <label className="font-medium text-[13px] text-[#1a1a1a]">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-0.5">*</span>}
                        </label>
                        {field.type === 'select' ? (
                          <select
                            value={additionalData[field.key] ?? ''}
                            onChange={e => {
                              setAdditionalData(prev => ({ ...prev, [field.key]: e.target.value }))
                              setAdditionalErrors(prev => ({ ...prev, [field.key]: '' }))
                            }}
                            className={`w-full h-10 bg-[#f9fafb] border rounded-lg px-[13px] text-[14px] text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#1e5fb8] focus:border-transparent ${additionalErrors[field.key] ? 'border-red-400' : 'border-[#e5e7eb]'}`}
                          >
                            <option value="">-- Pilih --</option>
                            {field.options.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.type}
                            value={additionalData[field.key] ?? ''}
                            onChange={e => {
                              setAdditionalData(prev => ({ ...prev, [field.key]: e.target.value }))
                              setAdditionalErrors(prev => ({ ...prev, [field.key]: '' }))
                            }}
                            placeholder={field.placeholder}
                            className={`w-full h-10 bg-[#f9fafb] border rounded-lg px-[13px] text-[14px] text-[#1a1a1a] placeholder-[rgba(26,26,26,0.4)] tracking-[-0.15px] focus:outline-none focus:ring-2 focus:ring-[#1e5fb8] focus:border-transparent ${additionalErrors[field.key] ? 'border-red-400' : 'border-[#e5e7eb]'}`}
                          />
                        )}
                        {additionalErrors[field.key] && (
                          <p className="text-[12px] text-red-500">{additionalErrors[field.key]}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={goStep1}
                    className="flex items-center gap-2 h-10 px-6 bg-[#1e5fb8] text-white rounded-lg font-medium text-[14px] hover:bg-[#1e3a8a] transition-colors border-0 cursor-pointer"
                  >
                    Lanjut <ChevronRightIcon />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Scan KTP ── */}
          {step === 2 && (
            <div className="bg-white border border-[#e5e7eb] rounded-xl" style={CARD_SHADOW}>
              <div className="px-6 pt-6 pb-4 border-b border-[#e5e7eb]">
                <h2 className="font-semibold text-[18px] text-[#1a1a1a]">Scan / Unggah KTP Warga</h2>
                <p className="mt-1 text-[14px] text-[#6b7280]">
                  Foto atau scan KTP warga yang datang langsung
                </p>
              </div>
              <div className="p-6 flex flex-col gap-6">

                {/* ── Offline banner ── */}
                {isOffline && (
                  <div
                    className="flex items-start gap-3 p-4 rounded-lg"
                    style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" className="shrink-0 mt-0.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z" />
                    </svg>
                    <div>
                      <p className="text-[13px] font-semibold text-[#b45309]">Mode Offline Aktif</p>
                      <p className="text-[12px] text-[#92400e] mt-0.5 leading-5">
                        Koneksi internet tidak terdeteksi. KTP akan diproses menggunakan <strong>Tesseract OCR</strong> (mesin lokal). Proses lebih lambat — pastikan foto KTP sangat jelas.
                      </p>
                    </div>
                  </div>
                )}

                <div className="max-w-md mx-auto w-full">
                  <UploadZone
                    label="Foto KTP Warga"
                    file={ktpFile}
                    preview={ktpPreview}
                    onFile={handleKtpFile}
                  />
                </div>

                {step2Error && <p className="text-[13px] text-red-500">{step2Error}</p>}

                {/* Tips untuk admin */}
                <div className="flex items-start gap-3 p-4 rounded-lg" style={{ background: 'rgba(30,95,184,0.05)', border: '1px solid rgba(30,95,184,0.12)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e5fb8" strokeWidth="2" className="shrink-0 mt-0.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                  </svg>
                  <div>
                    <p className="text-[13px] font-medium text-[#1e5fb8] mb-1">Tips untuk hasil terbaik</p>
                    <ul className="text-[13px] text-[#1e5fb8] leading-5 list-disc list-inside space-y-0.5">
                      <li>Letakkan KTP di permukaan datar di bawah pencahayaan yang cukup</li>
                      <li>Pastikan semua teks terbaca dan tidak terpotong</li>
                      <li>Gunakan mode scan dokumen jika tersedia di kamera</li>
                    </ul>
                  </div>
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
                    className="flex items-center gap-2 h-10 px-6 bg-[#1e5fb8] text-white rounded-lg font-medium text-[14px] hover:bg-[#1e3a8a] transition-colors border-0 cursor-pointer"
                  >
                    {isOffline ? 'Proses Offline (Tesseract)' : 'Proses dengan AI'} <ChevronRightIcon />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Verifikasi AI ── */}
          {step === 3 && (
            <div className="bg-white border border-[#e5e7eb] rounded-xl" style={CARD_SHADOW}>
              <div className="px-6 pt-6 pb-4 border-b border-[#e5e7eb]">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h2 className="font-semibold text-[18px] text-[#1a1a1a]">Verifikasi AI</h2>
                    <p className="mt-1 text-[14px] text-[#6b7280]">
                      {aiLoading
                        ? (isOffline ? 'Tesseract OCR sedang membaca KTP warga (mode offline)...' : 'Sistem AI sedang membaca KTP warga...')
                        : 'Periksa data hasil baca AI dan status warga'}
                    </p>
                  </div>
                  {!aiLoading && aiResult && (
                    <EngineBadge engine={aiResult.engine} />
                  )}
                </div>
              </div>
              <div className="p-6">
                {aiLoading ? (
                  <AIProcessingState progress={aiProgress} offline={isOffline} />
                ) : aiResult ? (
                  <div className="flex flex-col gap-6">
                    {/* Kualitas dokumen */}
                    <div>
                      <p className="text-[13px] font-medium text-[#1a1a1a] mb-3">Kualitas Dokumen</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] text-[#6b7280]">KTP:</span>
                        <QualityBadge status={aiResult.quality.ktp} />
                      </div>
                    </div>

                    <div className="border-t border-[#f3f4f6]" />

                    {/* KTP preview + form side by side */}
                    <div className="flex flex-col sm:flex-row gap-5 items-start">

                      {/* KTP image — tetap terlihat saat mengisi form */}
                      {ktpPreview && (
                        <div className="flex flex-col gap-2 w-full sm:w-52 shrink-0">
                          <p className="font-medium text-[13px] text-[#1a1a1a]">Foto KTP</p>
                          <button
                            type="button"
                            onClick={() => setImgZoomed(true)}
                            className="block w-full cursor-zoom-in border-0 bg-transparent p-0"
                          >
                            <img
                              src={ktpPreview}
                              alt="KTP"
                              className="w-full rounded-lg border border-[#e5e7eb] object-cover hover:opacity-90 transition-opacity"
                              style={{ maxHeight: 220 }}
                            />
                          </button>
                          <p className="text-[11px] text-[#9ca3af] text-center">Klik untuk perbesar</p>
                        </div>
                      )}

                      {/* Lightbox overlay */}
                      {imgZoomed && (
                        <div
                          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
                          onClick={() => setImgZoomed(false)}
                        >
                          <img
                            src={ktpPreview}
                            alt="KTP"
                            className="max-w-[92vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
                            onClick={e => e.stopPropagation()}
                          />
                          <button
                            type="button"
                            onClick={() => setImgZoomed(false)}
                            className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer border-0"
                            style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}

                      {/* Data hasil OCR */}
                      <div className="flex flex-col gap-4 flex-1 min-w-0">
                        <div className="flex flex-col gap-1">
                          <p className="font-medium text-[14px] text-[#1a1a1a]">Data Hasil Pembacaan AI</p>
                          <p className="text-[13px] text-[#6b7280]">Koreksi jika ada kesalahan pembacaan sebelum melanjutkan</p>
                        </div>
                        {[
                          { key: 'name', label: 'Nama Lengkap', placeholder: 'Nama sesuai KTP' },
                          { key: 'nik',  label: 'NIK',          placeholder: '16 digit NIK' },
                        ].map(({ key, label, placeholder }) => (
                          <div key={key} className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <label className="font-medium text-[13px] text-[#1a1a1a]">{label}</label>
                              {aiResult.completeness[key !== 'name' ? key : 'name'] && (
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
                        ))}
                        <div className="grid grid-cols-2 gap-4">
                          {[
                            { key: 'birthPlace', label: 'Tempat Lahir', placeholder: 'Kota kelahiran' },
                            { key: 'birthDate',  label: 'Tanggal Lahir', placeholder: 'YYYY-MM-DD' },
                          ].map(({ key, label, placeholder }) => (
                            <div key={key} className="flex flex-col gap-1.5">
                              <label className="font-medium text-[13px] text-[#1a1a1a]">{label}</label>
                              <input
                                type="text"
                                value={extracted[key]}
                                onChange={e => setExtracted(prev => ({ ...prev, [key]: e.target.value }))}
                                placeholder={placeholder}
                                className={inputBase}
                              />
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="font-medium text-[13px] text-[#1a1a1a]">Alamat</label>
                          <input
                            type="text"
                            value={extracted.address}
                            onChange={e => setExtracted(prev => ({ ...prev, address: e.target.value }))}
                            placeholder="Alamat sesuai KTP"
                            className={inputBase}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-[#f3f4f6]" />

                    {/* Identifikasi warga di sistem */}
                    <div>
                      <p className="font-medium text-[14px] text-[#1a1a1a] mb-3">Identifikasi Warga</p>
                      <CitizenMatchPanel status={citizenStatus} citizen={citizenData} />
                    </div>

                    <div className="flex justify-between pt-2">
                      <button
                        onClick={() => setStep(2)}
                        className="h-10 px-5 bg-white border border-[#e5e7eb] text-[#1a1a1a] rounded-lg font-medium text-[14px] hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        Kembali
                      </button>
                      <button
                        onClick={() => setStep(4)}
                        disabled={citizenStatus === 'searching'}
                        className="flex items-center gap-2 h-10 px-6 bg-[#1e5fb8] text-white rounded-lg font-medium text-[14px] hover:bg-[#1e3a8a] transition-colors border-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        title={citizenStatus === 'searching' ? 'Menunggu hasil pencarian warga...' : ''}
                      >
                        Konfirmasi Data <ChevronRightIcon />
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* ── Step 4: Konfirmasi ── */}
          {step === 4 && (
            <div className="bg-white border border-[#e5e7eb] rounded-xl" style={CARD_SHADOW}>
              <div className="px-6 pt-6 pb-4 border-b border-[#e5e7eb]">
                <h2 className="font-semibold text-[18px] text-[#1a1a1a]">Konfirmasi Permohonan</h2>
                <p className="mt-1 text-[14px] text-[#6b7280]">Periksa kembali sebelum mengirim</p>
              </div>
              <div className="p-6 flex flex-col gap-5">
                {/* Warga badge — dua kondisi: terhubung akun atau tidak */}
                {citizenData ? (
                  <div className="flex items-center gap-3 p-4 rounded-lg" style={{ background: 'rgba(22,163,114,0.07)', border: '1px solid rgba(22,163,114,0.2)' }}>
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <CheckIcon size={14} />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-green-700">{citizenData.full_name}</p>
                      <p className="text-[12px] text-green-600">NIK: {citizenData.nik} · {citizenData.email}</p>
                      <p className="text-[11px] text-green-600 mt-0.5">Permohonan akan dikaitkan dengan akun warga.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 rounded-lg" style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,0.15)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-amber-700">Pengajuan Tanpa Akun Sistem</p>
                      <p className="text-[12px] text-amber-700">Data warga diambil dari hasil scan KTP.</p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <SummaryRow label="Jenis Layanan"    value={SERVICE_LABELS[selectedService]} />
                  <SummaryRow label="Keperluan"         value={purpose} />
                  <SummaryRow label="Nama Lengkap"      value={extracted.name} />
                  <SummaryRow label="NIK"               value={extracted.nik} mono />
                  <SummaryRow label="Tempat, Tgl Lahir" value={`${extracted.birthPlace}, ${extracted.birthDate}`} />
                  <SummaryRow label="Alamat"            value={extracted.address} />

                  {(ADDITIONAL_FIELDS[selectedService] ?? []).length > 0 && (
                    <>
                      <div className="pt-2 pb-1">
                        <p className="text-[12px] font-semibold text-[#6b7280] uppercase tracking-wide">Data Tambahan</p>
                      </div>
                      {(ADDITIONAL_FIELDS[selectedService] ?? []).map(f => (
                        <SummaryRow key={f.key} label={f.label} value={additionalData[f.key] || '—'} />
                      ))}
                    </>
                  )}
                </div>

                {/* KTP thumbnail */}
                {ktpPreview && (
                  <div className="flex gap-4 pt-2">
                    <div className="flex flex-col gap-1">
                      <p className="text-[12px] text-[#6b7280] font-medium">KTP</p>
                      <img src={ktpPreview} className="w-28 h-16 object-cover rounded-lg border border-[#e5e7eb]" alt="KTP" />
                    </div>
                  </div>
                )}

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
                    className="flex items-center gap-2 h-10 px-6 bg-[#1e5fb8] text-white rounded-lg font-medium text-[14px] hover:bg-[#1e3a8a] transition-colors border-0 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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
