import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../routes/routes'
import { supabase } from '../../services/supabase'
import { getArchivedLetters } from '../../services/documentService'
import { formatDate } from '../../utils/formatDate'
import { SERVICE_TYPE_LABELS } from '../../utils/constants'

// ── Constants ─────────────────────────────────────────────────────────────────

const HERO_GRADIENT = '#1e5fb8'
const CARD_SHADOW = { boxShadow: '0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)' }

const STATUS_MAP = {
  signed:    { bg: 'rgba(22,163,114,0.1)', text: '#16a372', label: 'Ditandatangani' },
  completed: { bg: 'rgba(22,163,114,0.1)', text: '#16a372', label: 'Selesai' },
}

const SERVICE_FILTER_OPTIONS = [
  { value: 'semua',     label: 'Semua Jenis' },
  { value: 'domisili',  label: 'Surat Keterangan Domisili' },
  { value: 'pengantar', label: 'Surat Pengantar' },
  { value: 'sktm',      label: 'Surat Keterangan Tidak Mampu' },
  { value: 'usaha',     label: 'Surat Keterangan Usaha' },
  { value: 'kelahiran', label: 'Surat Keterangan Kelahiran' },
  { value: 'kematian',  label: 'Surat Keterangan Kematian' },
]

// Data demo saat Supabase belum terhubung — mencerminkan surat yang sudah resmi.
const DEMO_ARCHIVE = [
  {
    id: 'demo-arc-001', service_type: 'sktm', status: 'completed',
    created_at: '2026-06-26T08:30:00Z', signed_at: '2026-06-27T10:00:00Z',
    letter_number: '460/SKTM-012/VI/2026',
    profiles: { full_name: 'Daniel Abraham', nik: '3401012345678901' },
    letter_snapshot: { nik: '3401012345678901', full_name: 'Daniel Abraham' },
  },
  {
    id: 'demo-arc-002', service_type: 'domisili', status: 'completed',
    created_at: '2026-06-20T14:00:00Z', signed_at: '2026-06-21T09:30:00Z',
    letter_number: '474/SKD-008/VI/2026',
    profiles: { full_name: 'Siti Rahayu', nik: '3401098765432101' },
    letter_snapshot: { nik: '3401098765432101', full_name: 'Siti Rahayu' },
  },
  {
    id: 'demo-arc-003', service_type: 'usaha', status: 'signed',
    created_at: '2025-11-10T11:00:00Z', signed_at: '2025-11-11T13:00:00Z',
    letter_number: '503/SKU-003/XI/2025',
    profiles: { full_name: 'Budi Kurniawan', nik: '3401011112222301' },
    letter_snapshot: { nik: '3401011112222301', full_name: 'Budi Kurniawan' },
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
function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  )
}
function ShieldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  )
}
function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  )
}
function ArchiveIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
    </svg>
  )
}

// Buka preview surat di tab baru dengan auto-print (?print=1) agar admin bisa
// langsung "Save as PDF" dari dialog cetak browser — tanpa duplikasi file di Storage.
function openPrint(id) {
  window.open(`${ROUTES.ADMIN_LETTER_PRINT.replace(':id', id)}?print=1`, '_blank')
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function letterYear(req) {
  const base = req.signed_at ?? req.created_at
  return base ? new Date(base).getFullYear() : null
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ArchivePage() {
  const navigate = useNavigate()
  const [letters, setLetters]           = useState([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [serviceFilter, setServiceFilter] = useState('semua')
  const [yearFilter, setYearFilter]     = useState('semua')

  useEffect(() => {
    async function load() {
      if (!supabase) { setLetters(DEMO_ARCHIVE); setLoading(false); return }
      const data = await getArchivedLetters()
      setLetters(data)
      setLoading(false)
    }
    load()
  }, [])

  // Daftar tahun unik untuk dropdown filter (terbaru dulu).
  const years = [...new Set(letters.map(letterYear).filter(Boolean))].sort((a, b) => b - a)

  const filtered = letters.filter(r => {
    const q = search.toLowerCase().trim()
    const name   = (r.profiles?.full_name ?? r.letter_snapshot?.full_name ?? '').toLowerCase()
    const nik    = (r.profiles?.nik ?? r.letter_snapshot?.nik ?? '').toLowerCase()
    const number = (r.letter_number ?? '').toLowerCase()
    const matchSearch =
      q === '' || name.includes(q) || nik.includes(q) || number.includes(q)
    const matchService = serviceFilter === 'semua' || r.service_type === serviceFilter
    const matchYear    = yearFilter === 'semua' || letterYear(r) === Number(yearFilter)
    return matchSearch && matchService && matchYear
  })

  return (
    <div>
      <section style={{ background: HERO_GRADIENT }} className="py-8">
        <div className="max-w-[1280px] mx-auto px-4">
          <h1 className="font-medium text-white leading-tight tracking-[0.37px]" style={{ fontSize: 'clamp(22px, 5vw, 36px)', lineHeight: '1.2' }}>
            Arsip Surat
          </h1>
          <p className="mt-2 text-[14px] sm:text-[16px] leading-6 tracking-[-0.31px]" style={{ color: 'rgba(255,255,255,0.9)' }}>
            Dokumentasi digital seluruh surat yang telah ditandatangani Kepala Desa
          </p>
        </div>
      </section>

      <div className="max-w-[1280px] mx-auto px-4 pb-12">
        {/* Search + filter */}
        <div className="relative -mt-4 bg-white border border-[#e5e7eb] rounded-lg p-4" style={CARD_SHADOW}>
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"><SearchIcon /></div>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari nama, NIK, atau nomor surat..."
                className="w-full h-[42px] bg-white border border-[#e5e7eb] rounded-lg pl-[38px] pr-4 text-[14px] text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#1e5fb8] focus:border-transparent"
              />
            </div>
            <select
              value={serviceFilter}
              onChange={e => setServiceFilter(e.target.value)}
              className="h-[42px] bg-white border border-[#e5e7eb] rounded-lg px-3 text-[14px] text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#1e5fb8] cursor-pointer w-full lg:w-auto"
            >
              {SERVICE_FILTER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select
              value={yearFilter}
              onChange={e => setYearFilter(e.target.value)}
              className="h-[42px] bg-white border border-[#e5e7eb] rounded-lg px-3 text-[14px] text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#1e5fb8] cursor-pointer w-full lg:w-auto"
            >
              <option value="semua">Semua Tahun</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="mt-6 bg-white border border-[#e5e7eb] rounded-lg overflow-hidden" style={CARD_SHADOW}>
          <div className="px-6 py-5 border-b border-[#e5e7eb] flex items-center justify-between">
            <h2 className="font-medium text-[18px] text-[#1a1a1a] tracking-[-0.89px]">Daftar Arsip Surat</h2>
            <span className="text-[13px] text-[#6b7280]">{filtered.length} surat</span>
          </div>

          {loading ? (
            <div className="py-16 flex justify-center">
              <svg className="animate-spin w-6 h-6 text-[#1e5fb8]" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#e5e7eb" strokeWidth="3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="#1e5fb8" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#e5e7eb]">
                      {['Nomor Surat', 'Warga', 'Jenis Surat', 'Tgl. TTD', 'Status', 'Aksi'].map(col => (
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
                          Belum ada surat dalam arsip
                        </td>
                      </tr>
                    ) : filtered.map(req => {
                      const status = STATUS_MAP[req.status] ?? STATUS_MAP.signed
                      const name = req.profiles?.full_name ?? req.letter_snapshot?.full_name ?? '—'
                      const nik  = req.profiles?.nik ?? req.letter_snapshot?.nik ?? '—'
                      return (
                        <tr key={req.id} className="border-b border-[#e5e7eb] last:border-0 hover:bg-[#fafafa] transition-colors">
                          <td className="px-4 py-4 text-[13px] font-medium text-[#1a1a1a] whitespace-nowrap" style={{ fontFamily: 'Menlo, monospace' }}>
                            {req.letter_number ?? '—'}
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-[13px] font-medium text-[#1a1a1a]">{name}</p>
                            <p className="text-[11px] text-[#9ca3af] mt-0.5" style={{ fontFamily: 'Menlo, monospace' }}>{nik}</p>
                          </td>
                          <td className="px-4 py-4 text-[13px] text-[#1a1a1a] max-w-[200px]">
                            {SERVICE_TYPE_LABELS[req.service_type] ?? req.service_type}
                          </td>
                          <td className="px-4 py-4 text-[13px] text-[#6b7280] whitespace-nowrap">
                            {req.signed_at ? formatDate(req.signed_at) : formatDate(req.created_at)}
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium"
                              style={{ background: status.bg, color: status.text }}>
                              {status.label}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => navigate(ROUTES.ADMIN_LETTER_PRINT.replace(':id', req.id))}
                                className="flex items-center gap-1.5 h-8 px-3 bg-[#1e5fb8] rounded-lg text-[12px] font-medium text-white hover:bg-[#1e3a8a] transition-colors border-0 cursor-pointer whitespace-nowrap"
                              >
                                <EyeIcon /> Lihat
                              </button>
                              <button
                                type="button"
                                onClick={() => openPrint(req.id)}
                                title="Unduh PDF"
                                className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium text-[#1a1a1a] bg-white border border-[#e5e7eb] hover:bg-[#f9fafb] transition-colors cursor-pointer whitespace-nowrap"
                              >
                                <DownloadIcon /> PDF
                              </button>
                              <button
                                type="button"
                                onClick={() => window.open(ROUTES.VERIFY_LETTER.replace(':id', req.id), '_blank')}
                                title="Buka halaman verifikasi"
                                className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium text-[#1e5fb8] bg-white border border-[#bfdbfe] hover:bg-[#eff6ff] transition-colors cursor-pointer whitespace-nowrap"
                              >
                                <ShieldIcon /> Verifikasi
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden">
                {filtered.length === 0 ? (
                  <p className="px-4 py-14 text-center text-[14px] text-[#6b7280]">Belum ada surat dalam arsip</p>
                ) : filtered.map(req => {
                  const status = STATUS_MAP[req.status] ?? STATUS_MAP.signed
                  const name = req.profiles?.full_name ?? req.letter_snapshot?.full_name ?? '—'
                  const nik  = req.profiles?.nik ?? req.letter_snapshot?.nik ?? '—'
                  return (
                    <div key={req.id} className="px-4 py-4 border-b border-[#f3f4f6] last:border-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <p className="font-medium text-[14px] text-[#1a1a1a] truncate">
                            {SERVICE_TYPE_LABELS[req.service_type] ?? req.service_type}
                          </p>
                          <p className="text-[12px] text-[#1e5fb8] mt-0.5" style={{ fontFamily: 'Menlo, monospace' }}>
                            {req.letter_number ?? '—'}
                          </p>
                          <p className="text-[11px] text-[#9ca3af] mt-0.5">{name} · {nik}</p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium shrink-0 whitespace-nowrap"
                          style={{ background: status.bg, color: status.text }}>
                          {status.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[12px] text-[#9ca3af]">
                          {req.signed_at ? formatDate(req.signed_at) : formatDate(req.created_at)}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => navigate(ROUTES.ADMIN_LETTER_PRINT.replace(':id', req.id))}
                            className="flex items-center gap-1.5 h-8 px-3 bg-[#1e5fb8] rounded-lg text-[12px] font-medium text-white border-0 cursor-pointer shrink-0"
                          >
                            <EyeIcon /> Lihat
                          </button>
                          <button
                            type="button"
                            onClick={() => openPrint(req.id)}
                            aria-label="Unduh PDF"
                            className="flex items-center justify-center h-8 w-8 rounded-lg text-[#1a1a1a] bg-white border border-[#e5e7eb] hover:bg-[#f9fafb] transition-colors cursor-pointer shrink-0"
                          >
                            <DownloadIcon />
                          </button>
                          <button
                            type="button"
                            onClick={() => window.open(ROUTES.VERIFY_LETTER.replace(':id', req.id), '_blank')}
                            aria-label="Buka halaman verifikasi"
                            className="flex items-center justify-center h-8 w-8 rounded-lg text-[#1e5fb8] bg-white border border-[#bfdbfe] hover:bg-[#eff6ff] transition-colors cursor-pointer shrink-0"
                          >
                            <ShieldIcon />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Catatan arsip */}
        <div className="mt-6 flex items-start gap-3 rounded-lg px-5 py-4 text-[13px]"
          style={{ background: 'rgba(30,95,184,0.06)', border: '1px solid rgba(30,95,184,0.15)', color: '#1e3a8a' }}>
          <span className="shrink-0 mt-0.5"><ArchiveIcon /></span>
          <p className="leading-5">
            Arsip ini menyimpan <strong>salinan data surat (snapshot)</strong> pada saat ditandatangani,
            sehingga isi arsip tetap konsisten meski data warga diperbarui di kemudian hari.
            Setiap surat memiliki nomor resmi dan dapat diverifikasi melalui QR code.
          </p>
        </div>
      </div>
    </div>
  )
}
