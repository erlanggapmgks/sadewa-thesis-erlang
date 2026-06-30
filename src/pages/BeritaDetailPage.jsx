import { useParams, Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import { NEWS_ITEMS } from '../data/newsData'
import { ROUTES } from '../routes/routes'

// ── Icons ────────────────────────────────────────────────────────────────────

function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
    </svg>
  )
}

// ── Constants ─────────────────────────────────────────────────────────────────

const HERO_GRADIENT = 'linear-gradient(166.26deg, #1e40af 0%, #10b981 100%)'

// ── Sub-components ────────────────────────────────────────────────────────────

function ContentSection({ section }) {
  return (
    <div className="mt-6">
      <h3 className="font-medium text-[18px] text-[#1a1a1a] leading-[27px] tracking-[-0.44px]">
        {section.heading}
      </h3>
      {section.paragraphs.map((p, i) => (
        <p
          key={i}
          className="mt-3 text-[16px] text-[#1a1a1a] leading-[1.8] tracking-[-0.31px]"
        >
          {p}
        </p>
      ))}
      {section.list && (
        <ul className="mt-3 pl-5 list-disc flex flex-col gap-1">
          {section.list.map((item, i) => (
            <li key={i} className="text-[16px] text-[#1a1a1a] leading-[1.8] tracking-[-0.31px]">
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function RelatedCard({ id, title, excerpt }) {
  return (
    <Link to={`/berita/${id}`} className="no-underline block">
      <div
        className="bg-white border border-[#e5e7eb] rounded-lg p-4 hover:shadow-md transition-shadow"
        style={{ boxShadow: '0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)' }}
      >
        <p className="font-medium text-[16px] text-[#1a1a1a] leading-6 tracking-[-0.31px]">
          {title}
        </p>
        <p className="mt-2 text-[14px] text-[#6b7280] leading-5 tracking-[-0.15px] line-clamp-2">
          {excerpt}
        </p>
      </div>
    </Link>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function BeritaDetailPage() {
  const { id } = useParams()
  const article = NEWS_ITEMS.find((item) => item.id === Number(id))

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[#6b7280] text-lg">Berita tidak ditemukan.</p>
            <Link to={ROUTES.NEWS} className="mt-4 inline-block text-[#1e40af] hover:underline text-sm">
              ← Kembali ke Berita
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const related = NEWS_ITEMS.filter((item) => item.id !== article.id).slice(0, 2)

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">

        {/* Hero */}
        <section style={{ background: HERO_GRADIENT }} className="py-12">
          <div className="max-w-[1280px] mx-auto px-4">

            {/* Back link */}
            <Link
              to={ROUTES.NEWS}
              className="inline-flex items-center gap-2 no-underline mb-6"
              style={{ color: 'rgba(255,255,255,0.9)' }}
            >
              <ArrowLeftIcon />
              <span className="text-[16px] leading-6 tracking-[-0.31px]">Kembali ke Berita</span>
            </Link>

            {/* Article meta */}
            <div className="max-w-[896px]">
              <span className="inline-block bg-[rgba(59,130,246,0.1)] text-[#3b82f6] text-xs font-medium px-2.5 py-0.5 rounded-full">
                {article.category}
              </span>

              <h1 className="mt-4 font-medium text-[48px] text-white leading-[1.1] tracking-[0.35px]">
                {article.title}
              </h1>

              <div className="mt-6 flex items-center gap-8" style={{ color: 'rgba(255,255,255,0.9)' }}>
                <div className="flex items-center gap-2">
                  <CalendarIcon />
                  <span className="text-[16px] leading-6 tracking-[-0.31px]">{article.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <UserIcon />
                  <span className="text-[16px] leading-6 tracking-[-0.31px]">{article.author}</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Content area */}
        <div className="max-w-[1280px] mx-auto px-4 py-12 flex flex-col items-center">
          <div className="w-full max-w-[896px]">

            {/* Hero image */}
            <div
              className="bg-white border border-[#e5e7eb] rounded-lg overflow-hidden"
              style={{ boxShadow: '0px 1px 3px rgba(0,0,0,0.1), 0px 1px 2px rgba(0,0,0,0.06)' }}
            >
              <img
                src={article.heroImage}
                alt={article.title}
                className="w-full object-cover"
                style={{ height: '386px' }}
              />
            </div>

            {/* Share button */}
            <div className="flex justify-end pt-8">
              <button
                className="inline-flex items-center gap-2 h-9 px-[13px] bg-white border border-[#e5e7eb] rounded-lg text-sm font-medium text-[#1a1a1a] hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <ShareIcon />
                Bagikan Artikel
              </button>
            </div>

            {/* Article content card */}
            <div
              className="mt-8 bg-white border border-[#e5e7eb] rounded-lg"
              style={{ boxShadow: '0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)' }}
            >
              <div className="p-8">
                {/* Opening paragraph */}
                <p className="text-[16px] text-[#1a1a1a] leading-[1.8] tracking-[-0.31px]">
                  {article.content.opening}
                </p>

                {/* Sections */}
                {article.content.sections.map((section, i) => (
                  <ContentSection key={i} section={section} />
                ))}
              </div>
            </div>

            {/* Related articles */}
            <div className="mt-12">
              <h2 className="font-medium text-[24px] text-[#1a1a1a] leading-8 tracking-[0.07px]">
                Berita Terkait
              </h2>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {related.map((item) => (
                  <RelatedCard key={item.id} {...item} />
                ))}
              </div>
            </div>

          </div>
        </div>

      </main>

      <Footer />
    </div>
  )
}
