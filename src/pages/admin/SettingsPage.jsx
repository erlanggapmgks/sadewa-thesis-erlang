import { useState, useEffect, useRef } from 'react'
import { getVillageSetting, uploadSignature, setVillageSetting } from '../../services/settingsService'

const HERO_GRADIENT = 'linear-gradient(90deg, #1e40af 0%, #10b981 100%)'
const CARD_SHADOW   = { boxShadow: '0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)' }

const VILLAGE_INFO = [
  { label: 'Nama Desa',         value: 'Desa Wates' },
  { label: 'Kecamatan',         value: 'Kecamatan Tanjunganom' },
  { label: 'Kabupaten',         value: 'Kabupaten Nganjuk' },
  { label: 'Provinsi',          value: 'Jawa Timur' },
  { label: 'Kode Pos',          value: '64473' },
  { label: 'Alamat Balai Desa', value: 'Jl. Raya Wates No. 1, Desa Wates, Kec. Tanjunganom' },
  { label: 'Telepon',           value: '(0358) 321000' },
  { label: 'Email Resmi',       value: 'deswates@nganjukkab.go.id' },
]

const SERVICE_HOURS = [
  { day: 'Senin',  open: '08.00', close: '15.00' },
  { day: 'Selasa', open: '08.00', close: '15.00' },
  { day: 'Rabu',   open: '08.00', close: '15.00' },
  { day: 'Kamis',  open: '08.00', close: '15.00' },
  { day: 'Jumat',  open: '08.00', close: '11.30' },
  { day: 'Sabtu',  open: null,    close: null },
  { day: 'Minggu', open: null,    close: null },
]

const SYSTEM_INFO = [
  { label: 'Nama Sistem',    value: 'SADEWA' },
  { label: 'Versi',          value: '1.0.0' },
  { label: 'Database',       value: 'Supabase (PostgreSQL)' },
  { label: 'AI Engine',      value: 'Tesseract.js (OCR)' },
  { label: 'Frontend',       value: 'React 19 + Vite + Tailwind CSS v4' },
  { label: 'Authentication', value: 'Supabase Auth (Row Level Security)' },
]

function SectionCard({ title, icon, children }) {
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-lg" style={CARD_SHADOW}>
      <div className="flex items-center gap-2 px-6 py-5 border-b border-[#e5e7eb]">
        {icon}
        <h2 className="font-medium text-[16px] text-[#1a1a1a]">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-start gap-4 py-2.5 border-b border-[#f3f4f6] last:border-0">
      <span className="text-[13px] text-[#6b7280] shrink-0">{label}</span>
      <span className="text-[13px] font-medium text-[#1a1a1a] text-right">{value}</span>
    </div>
  )
}

function TtdSection() {
  const fileRef            = useRef(null)
  const [ttdUrl, setTtdUrl]       = useState(null)
  const [uploading, setUploading] = useState(false)
  const [status, setStatus]       = useState(null) // { ok, msg }

  useEffect(() => {
    getVillageSetting('ttd_url').then(url => setTtdUrl(url))
  }, [])

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setStatus({ ok: false, msg: 'File harus berupa gambar (PNG/JPG)' })
      return
    }
    setUploading(true)
    setStatus(null)
    const res = await uploadSignature(file)
    if (!res.ok) {
      setStatus({ ok: false, msg: res.message })
      setUploading(false)
      return
    }
    await setVillageSetting('ttd_url', res.url)
    setTtdUrl(res.url)
    setStatus({ ok: true, msg: 'Tanda tangan berhasil disimpan.' })
    setUploading(false)
  }

  async function handleRemove() {
    await setVillageSetting('ttd_url', null)
    setTtdUrl(null)
    setStatus({ ok: true, msg: 'Tanda tangan dihapus.' })
  }

  return (
    <SectionCard
      title="Tanda Tangan Kepala Desa"
      icon={
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
        </svg>
      }
    >
      <p className="text-[13px] text-[#6b7280] mb-4">
        Upload gambar tanda tangan kepala desa (PNG transparan direkomendasikan). Akan tampil otomatis di setiap surat yang diterbitkan.
      </p>

      {ttdUrl ? (
        <div className="mb-4">
          <p className="text-[12px] text-[#6b7280] mb-2">Preview tanda tangan saat ini:</p>
          <div className="border border-[#e5e7eb] rounded-lg p-4 bg-[#f9fafb] inline-block">
            <img
              src={ttdUrl}
              alt="Tanda tangan kepala desa"
              className="h-20 object-contain"
              style={{ maxWidth: 220 }}
            />
          </div>
        </div>
      ) : (
        <div className="mb-4 border border-dashed border-[#d1d5db] rounded-lg p-6 text-center bg-[#f9fafb]">
          <p className="text-[13px] text-[#9ca3af]">Belum ada tanda tangan yang diupload</p>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      <div className="flex items-center gap-3">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="h-9 px-4 rounded-lg text-[13px] font-medium text-white cursor-pointer border-0 hover:opacity-90 transition-opacity disabled:opacity-60"
          style={{ background: 'linear-gradient(90deg, #1e40af, #10b981)' }}
        >
          {uploading ? 'Mengupload...' : ttdUrl ? 'Ganti Tanda Tangan' : 'Upload Tanda Tangan'}
        </button>
        {ttdUrl && (
          <button
            onClick={handleRemove}
            className="h-9 px-4 rounded-lg text-[13px] font-medium text-[#ef4444] border border-[#fecaca] bg-white cursor-pointer hover:bg-red-50 transition-colors"
          >
            Hapus
          </button>
        )}
      </div>

      {status && (
        <p className="mt-3 text-[13px]" style={{ color: status.ok ? '#10b981' : '#ef4444' }}>
          {status.msg}
        </p>
      )}
    </SectionCard>
  )
}

export default function SettingsPage() {
  return (
    <div>
      <section style={{ background: HERO_GRADIENT }} className="py-8">
        <div className="max-w-[1280px] mx-auto px-4">
          <h1 className="font-medium text-[36px] text-white leading-10 tracking-[0.37px]">Pengaturan Sistem</h1>
          <p className="mt-2 text-[16px] leading-6" style={{ color: 'rgba(255,255,255,0.9)' }}>
            Informasi desa dan konfigurasi umum aplikasi SADEWA
          </p>
        </div>
      </section>

      <div className="max-w-[1280px] mx-auto px-4 py-8 pb-12 flex flex-col gap-6">

        {/* TTD Kepala Desa — full width, paling atas */}
        <TtdSection />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* Village info */}
        <SectionCard
          title="Informasi Desa"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="1.75">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12 11.204 3.045c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          }
        >
          {VILLAGE_INFO.map(r => <InfoRow key={r.label} {...r} />)}
        </SectionCard>

        <div className="flex flex-col gap-6">

          {/* Service hours */}
          <SectionCard
            title="Jam Pelayanan"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="1.75">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            }
          >
            {SERVICE_HOURS.map(h => (
              <div key={h.day} className="flex justify-between items-center py-2.5 border-b border-[#f3f4f6] last:border-0">
                <span className="text-[13px] text-[#6b7280] w-20">{h.day}</span>
                {h.open ? (
                  <span className="text-[13px] font-medium text-[#1a1a1a]">{h.open} – {h.close} WIB</span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium"
                    style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}>
                    Tutup
                  </span>
                )}
              </div>
            ))}
          </SectionCard>

          {/* System info */}
          <SectionCard
            title="Informasi Sistem"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="1.75">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0H3" />
              </svg>
            }
          >
            {SYSTEM_INFO.map(r => <InfoRow key={r.label} {...r} />)}
            <div className="mt-4 pt-4 border-t border-[#f3f4f6]">
              <div className="flex items-start gap-2 p-3 rounded-lg"
                style={{ background: 'rgba(30,64,175,0.05)', border: '1px solid rgba(30,64,175,0.1)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1e40af" strokeWidth="2" className="shrink-0 mt-0.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                </svg>
                <p className="text-[12px] text-[#1e40af] leading-5">
                  Sistem ini dikembangkan sebagai proyek tesis. Konfigurasi lanjutan dapat diatur langsung melalui Supabase Dashboard.
                </p>
              </div>
            </div>
          </SectionCard>
        </div>
        </div>
      </div>
    </div>
  )
}
