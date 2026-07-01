import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { verifyLetter } from '../services/settingsService'
import { ROUTES } from '../routes/routes'
import { formatDate } from '../utils/formatDate'
import { SERVICE_TYPE_LABELS } from '../utils/constants'

const ROMAN_MONTHS = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII']

function letterSerial(id) {
  const n = id.split('').reduce((s, c) => s + c.charCodeAt(0), 0) % 999 + 1
  return String(n).padStart(3, '0')
}

function getLetterCode(serviceType) {
  const codes = {
    domisili: { code: 'SKD', prefix: '474' },
    pengantar: { code: 'SKP', prefix: '474' },
    sktm:     { code: 'SKTM', prefix: '460' },
    usaha:    { code: 'SKU', prefix: '503' },
    kelahiran: { code: 'SKL', prefix: '474' },
    kematian: { code: 'SKMN', prefix: '474' },
  }
  return codes[serviceType] ?? codes.pengantar
}

function CheckCircleIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

function XCircleIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[12px] text-[#6b7280]">{label}</span>
      <span className="text-[14px] font-medium text-[#1a1a1a]">{value || '—'}</span>
    </div>
  )
}

export default function VerifyLetterPage() {
  const { id } = useParams()
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    verifyLetter(id).then(data => {
      setResult(data)
      setLoading(false)
    })
  }, [id])

  const letterNo = (() => {
    if (!result?.valid) return null
    const d = new Date(result.created_at)
    const { code, prefix } = getLetterCode(result.service_type)
    const serial = letterSerial(id)
    return `${prefix}/${code}-${serial}/${ROMAN_MONTHS[d.getMonth()]}/${d.getFullYear()}`
  })()

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f9fafb' }}>

      {/* Header */}
      <header className="bg-white border-b border-[#e5e7eb]">
        <div className="max-w-[640px] mx-auto px-4 h-14 flex items-center justify-between">
          <Link to={ROUTES.HOME} className="flex items-center gap-2 no-underline">
            <div className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #1e40af 0%, #10b981 100%)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M2 20V8.5L12 3l10 5.5V20h-5v-6H7v6H2z" />
                <path d="M9 20v-4h6v4" />
              </svg>
            </div>
            <span className="font-semibold text-[14px] text-[#1a1a1a]">SADEWA</span>
          </Link>
          <span className="text-[12px] text-[#6b7280]">Verifikasi Surat</span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[480px]">

          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <svg className="animate-spin w-8 h-8 text-[#1e40af]" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#e5e7eb" strokeWidth="3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="#1e40af" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <p className="text-[14px] text-[#6b7280]">Memverifikasi surat...</p>
            </div>
          ) : result?.valid ? (
            <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden"
              style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>

              {/* Status header */}
              <div className="px-6 py-8 flex flex-col items-center gap-3 text-center"
                style={{ background: 'rgba(16,185,129,0.05)', borderBottom: '1px solid rgba(16,185,129,0.15)' }}>
                <CheckCircleIcon />
                <div>
                  <h1 className="font-semibold text-[20px] text-[#1a1a1a] tracking-[-0.5px]">
                    Surat Terverifikasi
                  </h1>
                  <p className="text-[14px] text-[#6b7280] mt-1">
                    Surat ini adalah dokumen resmi yang diterbitkan oleh Kantor Kepala Desa Wates
                  </p>
                </div>
              </div>

              {/* Detail surat */}
              <div className="px-6 py-6 flex flex-col gap-5">
                <div className="grid grid-cols-2 gap-5">
                  <InfoRow label="Nomor Surat"    value={letterNo} />
                  <InfoRow label="Jenis Layanan"  value={SERVICE_TYPE_LABELS[result.service_type] ?? result.service_type} />
                  <InfoRow label="Atas Nama"      value={result.full_name} />
                  <InfoRow label="Tanggal Terbit" value={formatDate(result.created_at)} />
                </div>

                <div className="pt-4 border-t border-[#f3f4f6]">
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
                    style={{ background: 'rgba(16,185,129,0.08)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    <span className="text-[13px] text-[#059669] font-medium">
                      Status: Surat resmi & sah — diterbitkan oleh Desa Wates
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-[#9ca3af] text-center">
                  ID: {id}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden"
              style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
              <div className="px-6 py-10 flex flex-col items-center gap-3 text-center">
                <XCircleIcon />
                <div>
                  <h1 className="font-semibold text-[20px] text-[#1a1a1a] tracking-[-0.5px]">
                    Surat Tidak Ditemukan
                  </h1>
                  <p className="text-[14px] text-[#6b7280] mt-2">
                    Surat dengan ID ini tidak terdaftar atau belum diterbitkan secara resmi.
                  </p>
                </div>
                <div className="mt-2 px-3 py-2.5 rounded-lg w-full"
                  style={{ background: 'rgba(239,68,68,0.06)' }}>
                  <p className="text-[12px] text-[#dc2626]">
                    Jika Anda merasa ini adalah kesalahan, hubungi Kantor Desa Wates di (0358) 321000.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="py-4 text-center">
        <p className="text-[12px] text-[#9ca3af]">
          © 2026 SADEWA — Sistem Administrasi Desa Wates, Kec. Tanjunganom, Kab. Nganjuk
        </p>
      </footer>
    </div>
  )
}
