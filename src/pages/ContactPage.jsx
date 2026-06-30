import { useState } from 'react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'

// ── Constants ─────────────────────────────────────────────────────────────────

const HERO_GRADIENT = 'linear-gradient(170.67deg, #1e40af 0%, #10b981 100%)'
const CARD_SHADOW = { boxShadow: '0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)' }
const MAPS_URL = 'https://maps.app.goo.gl/QcnZXpisH2n1PSQ39'
const MAPS_EMBED = 'https://maps.google.com/maps?q=9X4J%2B86F+Wates+Nganjuk+Jawa+Timur&output=embed&hl=id&z=17'

// ── Icons ────────────────────────────────────────────────────────────────────

function LocationIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1e40af" strokeWidth="1.75" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.75" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
    </svg>
  )
}

function EmailIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1e40af" strokeWidth="1.75" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.75" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
    </svg>
  )
}

function CheckCircleIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.75" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

function ExternalLinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  )
}

// ── Data ─────────────────────────────────────────────────────────────────────

const CONTACT_INFO = [
  {
    icon: <LocationIcon />,
    title: 'Alamat',
    lines: ['Kantor Desa Wates', 'Wates, Kec. Nganjuk', 'Kab. Nganjuk, Jawa Timur 64482'],
  },
  {
    icon: <PhoneIcon />,
    title: 'Telepon',
    lines: ['+62 123 4567 890', '+62 123 4567 891'],
  },
  {
    icon: <EmailIcon />,
    title: 'Email',
    lines: ['info@desawates.go.id', 'support@desawates.go.id'],
  },
  {
    icon: <ClockIcon />,
    title: 'Jam Pelayanan',
    lines: ['Senin – Jumat: 08.00 – 16.00', 'Sabtu: 08.00 – 12.00', 'Minggu: Tutup'],
  },
]

const FAQS = [
  {
    q: 'Berapa lama waktu pemrosesan dokumen?',
    a: 'Sebagian besar dokumen diproses dalam 2–3 hari kerja setelah permohonan ditinjau oleh admin.',
  },
  {
    q: 'Apakah saya bisa melacak permohonan secara online?',
    a: 'Ya, semua permohonan dapat dilacak secara real-time melalui portal warga SADEWA.',
  },
  {
    q: 'Apakah saya harus datang ke kantor?',
    a: 'Sebagian besar layanan dapat diselesaikan sepenuhnya secara online. Kunjungan ke kantor hanya diperlukan untuk kasus tertentu.',
  },
]

// ── Sub-components ────────────────────────────────────────────────────────────

function InfoCard({ icon, title, lines }) {
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-lg p-6" style={CARD_SHADOW}>
      <div className="w-8 h-8 shrink-0">{icon}</div>
      <p className="mt-4 font-semibold text-[18px] text-[#1a1a1a] leading-[27px] tracking-[-0.44px]">
        {title}
      </p>
      <div className="mt-3 flex flex-col gap-1">
        {lines.map((line, i) => (
          <p key={i} className="text-sm text-[#6b7280] leading-5 tracking-[-0.15px]">
            {line}
          </p>
        ))}
      </div>
    </div>
  )
}

function CardShell({ title, children }) {
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-lg" style={CARD_SHADOW}>
      <div className="px-6 py-[22px] border-b border-[#e5e7eb]">
        <h2 className="font-medium text-[18px] text-[#1a1a1a] leading-[18px] tracking-[-0.89px]">
          {title}
        </h2>
      </div>
      <div className="px-6 pb-6 pt-5">{children}</div>
    </div>
  )
}

function FormField({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-medium text-[14px] text-[#1a1a1a] leading-5 tracking-[-0.15px]">
        {label}
      </label>
      {children}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ContactPage() {
  const [form, setForm] = useState({ nama: '', email: '', subjek: '', pesan: '' })
  const [submitted, setSubmitted] = useState(false)

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    setSubmitted(true)
  }

  const inputClass =
    'w-full h-10 bg-[#f9fafb] border border-[#e5e7eb] rounded-[6px] px-[13px] text-[14px] text-[#1a1a1a] placeholder-[#6b7280] tracking-[-0.15px] focus:outline-none focus:ring-2 focus:ring-[#1e40af] focus:border-transparent'

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">

        {/* Hero */}
        <section style={{ background: HERO_GRADIENT }} className="py-16">
          <div className="max-w-[1280px] mx-auto px-4">
            <h1 className="font-medium text-[48px] text-white leading-[48px] tracking-[0.35px]">
              Hubungi Kami
            </h1>
            <p
              className="mt-4 text-[20px] leading-7 tracking-[-0.45px] max-w-[640px]"
              style={{ color: 'rgba(255,255,255,0.9)' }}
            >
              Sampaikan pertanyaan atau keluhan Anda. Kami siap membantu.
            </p>
          </div>
        </section>

        {/* Info cards — overlap hero */}
        <div className="relative z-10 -mt-12">
          <div className="max-w-[1280px] mx-auto px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {CONTACT_INFO.map((card) => (
                <InfoCard key={card.title} {...card} />
              ))}
            </div>
          </div>
        </div>

        {/* Form + Map/FAQ */}
        <div className="max-w-[1280px] mx-auto px-4 pt-16 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Left — contact form */}
            <CardShell title="Kirim Pesan">
              {submitted ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                  <CheckCircleIcon />
                  <p className="font-medium text-[18px] text-[#1a1a1a]">Pesan Terkirim!</p>
                  <p className="text-sm text-[#6b7280] max-w-[320px] leading-5">
                    Terima kasih telah menghubungi kami. Tim kami akan merespons dalam 1–2 hari kerja.
                  </p>
                  <button
                    onClick={() => { setSubmitted(false); setForm({ nama: '', email: '', subjek: '', pesan: '' }) }}
                    className="mt-2 text-sm text-[#1e40af] hover:underline"
                  >
                    Kirim pesan lain
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <FormField label="Nama Lengkap">
                    <input
                      type="text"
                      name="nama"
                      value={form.nama}
                      onChange={handleChange}
                      placeholder="Masukkan nama Anda"
                      className={inputClass}
                      required
                    />
                  </FormField>

                  <FormField label="Alamat Email">
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="email.anda@contoh.com"
                      className={inputClass}
                      required
                    />
                  </FormField>

                  <FormField label="Subjek">
                    <input
                      type="text"
                      name="subjek"
                      value={form.subjek}
                      onChange={handleChange}
                      placeholder="Perihal pesan Anda"
                      className={inputClass}
                      required
                    />
                  </FormField>

                  <FormField label="Pesan">
                    <textarea
                      name="pesan"
                      value={form.pesan}
                      onChange={handleChange}
                      placeholder="Tulis pesan Anda di sini..."
                      rows={6}
                      className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-[6px] px-[13px] py-[9px] text-[14px] text-[#1a1a1a] placeholder-[#6b7280] tracking-[-0.15px] focus:outline-none focus:ring-2 focus:ring-[#1e40af] focus:border-transparent resize-none"
                      style={{ minHeight: '128px' }}
                      required
                    />
                  </FormField>

                  <button
                    type="submit"
                    className="w-full h-11 bg-[#1e40af] rounded-lg text-white font-medium text-[16px] leading-6 tracking-[-0.31px] flex items-center justify-center gap-2 hover:bg-[#1e3a8a] transition-colors mt-2 cursor-pointer"
                  >
                    <SendIcon />
                    Kirim Pesan
                  </button>
                </form>
              )}
            </CardShell>

            {/* Right — map + FAQ */}
            <div className="flex flex-col gap-6">

              {/* Map card */}
              <CardShell title="Peta Lokasi">
                <div className="rounded-lg overflow-hidden bg-[#f3f4f6]" style={{ height: '314px' }}>
                  <iframe
                    src={MAPS_EMBED}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Peta Kantor Desa Wates"
                  />
                </div>
                <p className="mt-4 text-[14px] text-[#6b7280] leading-5 tracking-[-0.15px]">
                  Kantor Desa Wates berlokasi di Wates, Kec. Nganjuk, Kabupaten Nganjuk, Jawa Timur 64482. Mudah dijangkau dengan transportasi umum.
                </p>
                <a
                  href={MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm text-[#1e40af] no-underline hover:underline"
                >
                  Buka di Google Maps
                  <ExternalLinkIcon />
                </a>
              </CardShell>

              {/* FAQ card */}
              <CardShell title="Pertanyaan yang Sering Diajukan">
                <div className="flex flex-col gap-4">
                  {FAQS.map((faq, i) => (
                    <div key={i} className={i > 0 ? 'pt-4 border-t border-[#f3f4f6]' : ''}>
                      <p className="font-medium text-[16px] text-[#1a1a1a] leading-6 tracking-[-0.31px]">
                        {faq.q}
                      </p>
                      <p className="mt-1 text-[14px] text-[#6b7280] leading-5 tracking-[-0.15px]">
                        {faq.a}
                      </p>
                    </div>
                  ))}
                </div>
              </CardShell>

            </div>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  )
}
