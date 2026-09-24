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
    domisili:  { code: 'SKD',  prefix: '474' },
    pengantar: { code: 'SKP',  prefix: '474' },
    sktm:      { code: 'SKTM', prefix: '460' },
    usaha:     { code: 'SKU',  prefix: '503' },
    kelahiran: { code: 'SKL',  prefix: '474' },
    kematian:  { code: 'SKMN', prefix: '474' },
  }
  return codes[serviceType] ?? codes.pengantar
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function ShieldCheckIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  )
}

function XCircleIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

function InfoRow({ label, value, mono }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </span>
      <span style={{
        fontSize: '14px',
        fontWeight: '500',
        color: '#111827',
        fontFamily: mono ? 'Courier, monospace' : 'inherit',
        letterSpacing: mono ? '1px' : 'normal',
      }}>
        {value || '—'}
      </span>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function VerifyLetterPage() {
  const { id }            = useParams()
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
    <div className="min-h-screen flex flex-col" style={{ background: '#f3f4f6' }}>

      {/* ── Header ── */}
      <header style={{ background: '#1e3a6e', borderBottom: '3px solid #c8a23a' }}>
        <div className="max-w-[640px] mx-auto px-4 h-16 flex items-center justify-between">
          <Link to={ROUTES.HOME} className="flex items-center gap-2.5 no-underline">
            <img src="/sadewa-logo.png" alt="Logo Desa Wates" style={{ width: 36, height: 36, objectFit: 'contain' }} />
            <div>
              <p style={{ fontSize: '13px', fontWeight: '700', color: 'white', lineHeight: 1.2, letterSpacing: '0.5px' }}>
                SADEWA
              </p>
              <p style={{ fontSize: '10px', color: '#93c5fd', lineHeight: 1.2 }}>
                Desa Wates, Kab. Nganjuk
              </p>
            </div>
          </Link>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'rgba(255,255,255,0.1)', borderRadius: '20px',
            padding: '5px 12px',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
            <span style={{ fontSize: '11px', color: '#bfdbfe', fontWeight: '500' }}>Verifikasi Surat</span>
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-[520px] flex flex-col gap-4">

          {/* Loading */}
          {loading && (
            <div className="bg-white rounded-2xl flex flex-col items-center gap-4 py-16"
              style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
              <svg className="animate-spin w-9 h-9" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#e5e7eb" strokeWidth="3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="#1e3a6e" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>Memverifikasi dokumen...</p>
            </div>
          )}

          {/* ── VALID ── */}
          {!loading && result?.valid && (
            <>
              {/* Status badge card */}
              <div className="rounded-2xl overflow-hidden" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>

                {/* Green hero banner */}
                <div style={{
                  background: 'linear-gradient(135deg, #065f46 0%, #047857 60%, #059669 100%)',
                  padding: '28px 24px',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* Decorative circles */}
                  <div style={{
                    position: 'absolute', top: -30, right: -30,
                    width: 120, height: 120,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.06)',
                  }} />
                  <div style={{
                    position: 'absolute', bottom: -20, left: 60,
                    width: 80, height: 80,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.04)',
                  }} />

                  <div className="flex items-center gap-4 relative">
                    {/* Shield icon */}
                    <div style={{
                      width: 64, height: 64, borderRadius: '50%',
                      background: 'rgba(255,255,255,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                      border: '2px solid rgba(255,255,255,0.25)',
                    }}>
                      <ShieldCheckIcon />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{
                          fontSize: '10px', fontWeight: '700', letterSpacing: '1.5px',
                          background: 'rgba(255,255,255,0.2)',
                          color: 'white', padding: '2px 8px', borderRadius: '20px',
                          textTransform: 'uppercase',
                        }}>
                          DOKUMEN SAH
                        </span>
                      </div>
                      <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'white', lineHeight: 1.2, margin: 0 }}>
                        Surat Terverifikasi
                      </h1>
                      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', marginTop: '4px', lineHeight: 1.4 }}>
                        Dokumen ini diterbitkan secara resmi oleh<br />
                        <strong style={{ color: 'rgba(255,255,255,0.9)' }}>Pemerintah Desa Wates, Kab. Nganjuk</strong>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Detail surat */}
                <div style={{ background: 'white', padding: '24px' }}>

                  {/* Checklist poin keabsahan */}
                  <div className="flex flex-col gap-2 mb-6">
                    {[
                      'Surat terdaftar dalam sistem SADEWA',
                      'Diterbitkan oleh petugas berwenang',
                      'Data telah diverifikasi & disetujui Kepala Desa',
                    ].map(text => (
                      <div key={text} className="flex items-center gap-2.5">
                        <div style={{
                          width: 20, height: 20, borderRadius: '50%',
                          background: 'rgba(5,150,105,0.1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <CheckIcon />
                        </div>
                        <span style={{ fontSize: '13px', color: '#374151' }}>{text}</span>
                      </div>
                    ))}
                  </div>

                  {/* Divider */}
                  <div style={{ height: '1px', background: '#f3f4f6', marginBottom: '20px' }} />

                  {/* Info rows grid */}
                  <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                    <InfoRow label="Nomor Surat"    value={letterNo} />
                    <InfoRow label="Jenis Layanan"  value={SERVICE_TYPE_LABELS[result.service_type] ?? result.service_type} />
                    <InfoRow label="Atas Nama"      value={result.full_name} />
                    <InfoRow label="Tanggal Terbit" value={formatDate(result.created_at)} />
                    {result.nik && (
                      <div className="col-span-2">
                        <InfoRow label="NIK" value={result.nik} mono />
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div style={{ height: '1px', background: '#f3f4f6', margin: '20px 0' }} />

                  {/* Penerbit */}
                  <div style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}>
                    <img src="/sadewa-logo.png" alt="Logo Desa Wates"
                      style={{ width: 32, height: 32, objectFit: 'contain', flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: '12px', fontWeight: '600', color: '#065f46', margin: 0 }}>
                        Kantor Kepala Desa Wates
                      </p>
                      <p style={{ fontSize: '11px', color: '#6b7280', margin: 0, marginTop: '1px' }}>
                        Kec. Tanjunganom, Kab. Nganjuk, Jawa Timur
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ID surat kecil */}
              <p style={{ textAlign: 'center', fontSize: '11px', color: '#9ca3af' }}>
                ID Dokumen: <span style={{ fontFamily: 'Courier, monospace' }}>{id}</span>
              </p>
            </>
          )}

          {/* ── INVALID ── */}
          {!loading && !result?.valid && (
            <div className="bg-white rounded-2xl overflow-hidden"
              style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>

              {/* Red hero */}
              <div style={{
                background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 60%, #dc2626 100%)',
                padding: '28px 24px',
              }}>
                <div className="flex items-center gap-4">
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    border: '2px solid rgba(255,255,255,0.25)',
                  }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                    </svg>
                  </div>
                  <div>
                    <span style={{
                      fontSize: '10px', fontWeight: '700', letterSpacing: '1.5px',
                      background: 'rgba(255,255,255,0.2)',
                      color: 'white', padding: '2px 8px', borderRadius: '20px',
                    }}>
                      TIDAK VALID
                    </span>
                    <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'white', lineHeight: 1.2, margin: '6px 0 0' }}>
                      Surat Tidak Ditemukan
                    </h1>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', marginTop: '4px' }}>
                      Dokumen ini tidak terdaftar dalam sistem resmi Desa Wates
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ background: 'white', padding: '24px' }}>
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '10px',
                  padding: '14px',
                  marginBottom: '16px',
                }}>
                  <p style={{ fontSize: '13px', color: '#991b1b', fontWeight: '600', margin: '0 0 4px' }}>
                    Kemungkinan penyebab:
                  </p>
                  <ul style={{ fontSize: '13px', color: '#7f1d1d', margin: 0, paddingLeft: '18px', lineHeight: 1.7 }}>
                    <li>Surat belum pernah diterbitkan secara resmi</li>
                    <li>QR Code rusak atau tidak terbaca dengan benar</li>
                    <li>Surat merupakan dokumen palsu</li>
                  </ul>
                </div>
                <p style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center' }}>
                  Jika Anda merasa ini adalah kesalahan, hubungi Kantor Desa Wates<br />
                  <strong style={{ color: '#374151' }}>📞 (0358) 321000</strong>
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer style={{ background: '#1e3a6e', borderTop: '3px solid #c8a23a', padding: '16px 0' }}>
        <div className="max-w-[640px] mx-auto px-4 flex flex-col items-center gap-1">
          <p style={{ fontSize: '12px', color: '#93c5fd', fontWeight: '500', margin: 0 }}>
            SADEWA — Sistem Administrasi Desa Wates
          </p>
          <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>
            © 2026 · Pemerintah Desa Wates, Kec. Tanjunganom, Kab. Nganjuk · Jawa Timur
          </p>
        </div>
      </footer>
    </div>
  )
}
