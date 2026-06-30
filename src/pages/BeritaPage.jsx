import { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import { NEWS_ITEMS } from '../data/newsData'

// ── Icons ────────────────────────────────────────────────────────────────────

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.75" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
  )
}

// ── Data ─────────────────────────────────────────────────────────────────────

const HERO_GRADIENT = 'linear-gradient(169.51deg, #1e40af 0%, #10b981 100%)'

// ── Sub-components ────────────────────────────────────────────────────────────

function NewsCard({ id, image, category, title, excerpt, date }) {
  return (
    <article className="bg-white border border-[#e5e7eb] rounded-lg shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      <img
        src={image}
        alt={title}
        className="w-full h-48 object-cover"
        loading="lazy"
      />
      <div className="flex flex-col flex-1 px-6 pt-6 pb-6 gap-3">
        <span className="inline-block bg-[rgba(59,130,246,0.1)] text-[#3b82f6] text-xs font-medium px-2.5 py-0.5 rounded-full w-fit">
          {category}
        </span>
        <h3 className="font-medium text-[18px] text-[#1a1a1a] leading-[1.3] tracking-[-0.89px]">
          {title}
        </h3>
        <p className="text-sm text-[#6b7280] leading-5 tracking-[-0.15px] flex-1 line-clamp-3">
          {excerpt}
        </p>
        <div className="flex items-center justify-between pt-2 border-t border-[#f3f4f6] mt-auto">
          <div className="flex items-center gap-2">
            <CalendarIcon />
            <span className="text-sm text-[#6b7280]">{date}</span>
          </div>
          <Link
            to={`/berita/${id}`}
            className="flex items-center gap-1 text-sm text-[#1e40af] no-underline hover:underline"
          >
            Baca Selengkapnya
            <ArrowRightIcon />
          </Link>
        </div>
      </div>
    </article>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function BeritaPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = NEWS_ITEMS.filter((item) => {
    const q = searchQuery.toLowerCase()
    return (
      item.title.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.excerpt.toLowerCase().includes(q)
    )
  })

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">

        {/* Hero */}
        <section style={{ background: HERO_GRADIENT }} className="py-16">
          <div className="max-w-[1280px] mx-auto px-4">
            <h1 className="font-medium text-[48px] text-white leading-[48px] tracking-[0.35px]">
              Berita Desa
            </h1>
            <p
              className="mt-4 text-[20px] leading-7 tracking-[-0.45px] max-w-[672px]"
              style={{ color: 'rgba(255,255,255,0.9)' }}
            >
              Tetap terinformasi dengan perkembangan dan kegiatan terbaru di Desa Wates
            </p>
          </div>
        </section>

        {/* Search bar + News grid — same container */}
        <div className="max-w-[1280px] mx-auto px-4 pb-16">

          {/* Search card */}
          <div
            className="bg-white border border-[#e5e7eb] p-px"
            style={{
              marginTop: '64px',
              marginBottom: '64px',
              borderRadius: '8px',
              boxShadow: '0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)',
            }}
          >
            <div className="p-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berita..."
                className="w-full h-[42px] bg-white border border-[#e5e7eb] text-lg text-[#1a1a1a] placeholder-[rgba(26,26,26,0.5)] tracking-[-0.31px] focus:outline-none focus:ring-2 focus:ring-[#1e40af] focus:border-transparent"
                style={{ borderRadius: '8px', padding: '8px' }}
              />
            </div>
          </div>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((item) => (
                <NewsCard key={item.id} {...item} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-[#6b7280] text-base">
                Tidak ada berita yang cocok dengan "<strong>{searchQuery}</strong>".
              </p>
            </div>
          )}
        </div>

      </main>

      <Footer />
    </div>
  )
}
