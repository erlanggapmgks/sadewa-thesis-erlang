import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { getRequestById } from '../../services/documentService'

// ── Data helpers ──────────────────────────────────────────────────────────────

const ROMAN_MONTHS = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII']
const MONTHS_ID    = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

function todayIndonesian() {
  const d = new Date()
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`
}

function letterSerial(id) {
  const n = id.split('').reduce((s, c) => s + c.charCodeAt(0), 0) % 999 + 1
  return String(n).padStart(3, '0')
}

function getConfig(serviceType) {
  const map = {
    domisili: {
      code: 'SKD', prefix: '474',
      title: 'SURAT KETERANGAN DOMISILI',
      statement: 'Adalah benar warga Desa Wates, Kecamatan Tanjunganom, Kabupaten Nganjuk yang berdomisili di alamat tersebut di atas dan saat ini masih tercatat sebagai penduduk yang sah.',
    },
    pengantar: {
      code: 'SKP', prefix: '474',
      title: 'SURAT PENGANTAR',
      statement: 'Adalah benar warga Desa Wates, Kecamatan Tanjunganom, Kabupaten Nganjuk. Surat pengantar ini diberikan agar yang bersangkutan dapat mempergunakan sebagaimana mestinya.',
    },
    sktm: {
      code: 'SKTM', prefix: '460',
      title: 'SURAT KETERANGAN TIDAK MAMPU',
      statement: 'Adalah benar warga Desa Wates yang termasuk dalam kategori keluarga kurang mampu berdasarkan data yang ada pada kami, dan berhak mendapatkan pelayanan sesuai ketentuan yang berlaku.',
    },
    usaha: {
      code: 'SKU', prefix: '503',
      title: 'SURAT KETERANGAN USAHA',
      statement: 'Adalah benar warga Desa Wates yang menjalankan kegiatan usaha di wilayah Desa Wates, Kecamatan Tanjunganom, Kabupaten Nganjuk, dan tidak keberatan jika yang bersangkutan diberikan pelayanan yang diperlukan.',
    },
    kelahiran: {
      code: 'SKL', prefix: '474',
      title: 'SURAT KETERANGAN KELAHIRAN',
      statement: 'Adalah benar telah lahir seorang anak dari warga yang berdomisili di Desa Wates, Kecamatan Tanjunganom, Kabupaten Nganjuk, Daerah Istimewa Yogyakarta.',
    },
    kematian: {
      code: 'SKMN', prefix: '474',
      title: 'SURAT KETERANGAN KEMATIAN',
      statement: 'Adalah benar telah meninggal dunia warga yang berdomisili di Desa Wates, Kecamatan Tanjunganom, Kabupaten Nganjuk, Daerah Istimewa Yogyakarta.',
    },
  }
  return map[serviceType] ?? map.pengantar
}

// ── Demo data ─────────────────────────────────────────────────────────────────

const DEMO_REQUEST = {
  id: 'demo-req-001',
  service_type: 'sktm',
  created_at: '2026-06-28T08:30:00Z',
  purpose: 'Untuk keperluan pengajuan keringanan biaya pengobatan di rumah sakit.',
  profiles: { full_name: 'Daniel Abraham', nik: '3401012345678901' },
  extracted_documents: [{
    full_name: 'Daniel Abraham',
    nik: '3401012345678901',
    birth_date: 'Nganjuk, 17 Agustus 1992',
    address: 'Jl. Raya Wates No. 5 RT 003/RW 002, Desa Wates, Kec. Tanjunganom, Kab. Nganjuk',
  }],
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function LetterPrintPage() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const [req, setReq]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!supabase) { setReq(DEMO_REQUEST); setLoading(false); return }
      const data = await getRequestById(id)
      setReq(data ?? DEMO_REQUEST)
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#e5e7eb]">
        <svg className="animate-spin w-7 h-7 text-[#1e40af]" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#e5e7eb" strokeWidth="3" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="#1e40af" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    )
  }

  if (!req) return null

  const config    = getConfig(req.service_type)
  const ext       = req.extracted_documents?.[0] ?? null
  const name      = ext?.full_name  ?? req.profiles?.full_name ?? '—'
  const nik       = ext?.nik        ?? req.profiles?.nik       ?? '—'
  const birthDate = ext?.birth_date ?? '—'
  const address   = ext?.address    ?? '—'

  const d      = new Date(req.created_at)
  const roman  = ROMAN_MONTHS[d.getMonth()]
  const year   = d.getFullYear()
  const serial = letterSerial(id)
  const letterNo = `${config.prefix}/${config.code}-${serial}/${roman}/${year}`

  const dataRows = [
    { label: 'Nama Lengkap',       value: name,      bold: true },
    { label: 'NIK',                value: nik,       mono: true },
    { label: 'Tempat, Tgl. Lahir', value: birthDate },
    { label: 'Alamat',             value: address },
    ...(req.purpose ? [{ label: 'Keperluan', value: req.purpose }] : []),
  ]

  return (
    <>
      {/* Print CSS */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; background: white; }
          .letter-wrap { background: white !important; padding: 0 !important; min-height: unset !important; }
          .letter-paper { box-shadow: none !important; margin: 0 !important; max-width: 100% !important; padding: 15mm 20mm 20mm !important; }
        }
      `}</style>

      {/* Screen header */}
      <div
        className="no-print sticky top-0 z-10 bg-white border-b border-[#e5e7eb] px-6 py-3 flex items-center justify-between gap-4"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[14px] font-medium text-[#6b7280] hover:text-[#1a1a1a] transition-colors cursor-pointer border-0 bg-transparent p-0"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Kembali
        </button>

        <p className="font-medium text-[15px] text-[#1a1a1a]">Preview Surat — {letterNo}</p>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 h-9 px-4 rounded-lg text-[14px] font-medium text-white cursor-pointer border-0 hover:opacity-90 transition-opacity"
          style={{ background: 'linear-gradient(90deg, #1e40af, #10b981)' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
          </svg>
          Cetak / Unduh PDF
        </button>
      </div>

      {/* Letter area */}
      <div className="letter-wrap min-h-screen py-10" style={{ background: '#d1d5db' }}>
        <div
          className="letter-paper mx-auto bg-white"
          style={{
            maxWidth: '210mm',
            minHeight: '297mm',
            padding: '18mm 22mm 24mm',
            boxShadow: '0 8px 40px rgba(0,0,0,0.20)',
            fontFamily: '"Times New Roman", Times, serif',
            fontSize: '12pt',
            lineHeight: 1.65,
            color: '#111',
          }}
        >
          {/* ── KOP SURAT ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '6px' }}>
            {/* Emblem */}
            <div style={{
              width: 76, height: 76, borderRadius: '50%',
              border: '3px double #111',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, fontSize: '28px', color: '#1e40af',
              fontFamily: 'serif',
            }}>
              ⚜
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: '10pt', letterSpacing: '0.5px' }}>
                PEMERINTAH KABUPATEN NGANJUK
              </div>
              <div style={{ fontSize: '11pt', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                KECAMATAN TANJUNGANOM
              </div>
              <div style={{ fontSize: '14pt', fontWeight: 'bold', letterSpacing: '1px' }}>
                KANTOR KEPALA DESA WATES
              </div>
              <div style={{ fontSize: '9pt', marginTop: '2px' }}>
                Jl. Raya Wates No. 1, Desa Wates, Kec. Tanjunganom, Kab. Nganjuk 64473 &nbsp;·&nbsp; Telp. (0358) 321000
              </div>
            </div>
          </div>

          {/* Double rule */}
          <div style={{ borderTop: '4px double #111', marginBottom: '18px', marginTop: '4px' }} />

          {/* ── JUDUL ── */}
          <div style={{ textAlign: 'center', marginBottom: '4px' }}>
            <div style={{ fontSize: '13pt', fontWeight: 'bold', textDecoration: 'underline', letterSpacing: '1.5px' }}>
              {config.title}
            </div>
            <div style={{ fontSize: '11pt', marginTop: '6px' }}>
              Nomor : {letterNo}
            </div>
          </div>

          <div style={{ height: '22px' }} />

          {/* ── PEMBUKAAN ── */}
          <p style={{ textAlign: 'justify', marginBottom: '14px', textIndent: '36px' }}>
            Yang bertanda tangan di bawah ini, Kepala Desa Wates, Kecamatan Tanjunganom, Kabupaten Nganjuk,
            Jawa Timur, dengan ini menerangkan bahwa :
          </p>

          {/* ── DATA ── */}
          <table style={{ marginLeft: '48px', marginBottom: '16px', borderCollapse: 'collapse', width: 'calc(100% - 48px)' }}>
            <tbody>
              {dataRows.map(({ label, value, bold, mono }) => (
                <tr key={label}>
                  <td style={{ width: '170px', verticalAlign: 'top', paddingBottom: '3px', fontWeight: bold ? 'bold' : 'normal' }}>
                    {label}
                  </td>
                  <td style={{ width: '18px', verticalAlign: 'top', paddingBottom: '3px' }}>:</td>
                  <td style={{
                    verticalAlign: 'top', paddingBottom: '3px',
                    fontWeight: bold ? 'bold' : 'normal',
                    fontFamily: mono ? 'Courier, monospace' : 'inherit',
                    letterSpacing: mono ? '1px' : 'normal',
                  }}>
                    {value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ── ISI SURAT ── */}
          <p style={{ textAlign: 'justify', marginBottom: '14px', textIndent: '36px' }}>
            {config.statement}
          </p>

          {/* ── PENUTUP ── */}
          <p style={{ textAlign: 'justify', marginBottom: '30px', textIndent: '36px' }}>
            Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan
            sebagaimana mestinya.
          </p>

          {/* ── TANDA TANGAN ── */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ textAlign: 'center', minWidth: '210px' }}>
              <p style={{ marginBottom: '4px' }}>Wates, {todayIndonesian()}</p>
              <p style={{ marginBottom: '80px' }}>Kepala Desa Wates,</p>
              <p style={{ fontWeight: 'bold', textDecoration: 'underline' }}>Sugeng Waluyo, S.Sos.</p>
              <p style={{ marginTop: '3px' }}>NIP. 19680517 199003 1 002</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
